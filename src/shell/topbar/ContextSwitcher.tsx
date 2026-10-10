import { Link, useRouterState } from "@tanstack/react-router";
import { Check, ChevronDown, Compass, Plus } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { useIsMobile } from "~/hooks/use-mobile";
import { initials } from "~/lib/initials";
import { cn } from "~/lib/utils";
import { useAccountItems } from "~/shell/account/AccountMenu";
import {
	buildSwitchTarget,
	type ShellContext,
	type SwitchTarget,
} from "~/shell/context";
import { useCurrentUser } from "~/shell/hooks/useCurrentUser";
import { useFocusedStartup } from "~/shell/hooks/useFocusedStartup";
import { StartupAvatar } from "~/shell/topbar/StartupAvatar";

type Entry = {
	readonly key: string;
	readonly href: string;
	readonly label: string;
	readonly description: string;
	readonly avatar: ReactNode;
	readonly current: boolean;
};

type AvatarUser = {
	readonly name?: string | null;
	readonly email?: string | null;
	readonly image?: string | null;
};

const GROUP_LABEL_CLASS =
	"px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";
const SHEET_ROW_CLASS =
	"flex min-h-13 items-center gap-3 rounded-md px-2 text-sm hover:bg-accent";
const CREATE_ICON_CLASS =
	"flex size-7 shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/50 text-muted-foreground";
const NO_STARTUPS_HINT = "Run Cycles and hire through hackathons";

/**
 * Picks whose work you're looking at: Personal (your tasks, hackathons and
 * inbox) or one of your Startups, in two labelled groups. A dropdown on
 * desktop, a bottom sheet on phone (with Explore and the account items
 * below, since the top bar hides them there). It only navigates; the
 * /s/$slug layout still writes focus.
 */
export function ContextSwitcher({
	context,
}: {
	readonly context: ShellContext;
}) {
	const isMobile = useIsMobile();
	const [sheetOpen, setSheetOpen] = useState(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { memberships, isLoading: membershipsLoading } = useFocusedStartup();
	const { user, isLoading: userLoading } = useCurrentUser();

	const fullName = user?.name ?? "You";
	const firstName = fullName.split(" ")[0] || fullName;
	const currentStartup =
		context.kind === "startup"
			? memberships.find((m) => m.startup.slug === context.slug)
			: undefined;
	const isPersonal = context.kind === "you";
	const label = currentStartup
		? currentStartup.startup.name
		: isPersonal
			? firstName
			: "Choose workspace";

	const target = (to: SwitchTarget) =>
		buildSwitchTarget({ pathname, target: to });
	const personal: Entry = {
		key: "you",
		href: target("you"),
		label: fullName,
		description: "Your tasks, hackathons and inbox",
		avatar: <UserAvatar user={user} className="size-7" />,
		current: isPersonal,
	};
	const startups: Entry[] = memberships.map(({ startup, role }) => ({
		key: startup._id,
		href: target({ slug: startup.slug }),
		label: startup.name,
		description: role === "founder" ? "Founder" : "Member",
		avatar: <StartupAvatar name={startup.name} className="size-7 shrink-0" />,
		current: startup._id === currentStartup?.startup._id,
	}));
	const createHint = startups.length === 0 ? NO_STARTUPS_HINT : null;

	if (membershipsLoading || userLoading || context.kind === "loading") {
		return <Skeleton className="h-8 w-32 rounded-lg" aria-hidden />;
	}

	const trigger = (
		<button
			type="button"
			aria-label={`Switch workspace, current: ${label}`}
			className={cn(
				"flex h-8 min-w-0 max-w-full items-center gap-2 rounded-lg border border-border bg-muted/40 pr-2 text-sm font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60",
				currentStartup || isPersonal ? "pl-1" : "pl-2.5",
			)}
		>
			{currentStartup ? (
				<StartupAvatar
					name={currentStartup.startup.name}
					className="size-5.5 shrink-0"
				/>
			) : isPersonal ? (
				<UserAvatar user={user} className="size-5.5 shrink-0" />
			) : null}
			<span className="min-w-0 truncate">{label}</span>
			{currentStartup ? (
				<span className="hidden shrink-0 text-xs font-normal text-muted-foreground md:inline">
					Startup
				</span>
			) : null}
			<ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
		</button>
	);

	if (!isMobile) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
				<DropdownMenuContent
					align="start"
					className="max-h-[28rem] w-72 overflow-y-auto"
				>
					<DropdownMenuGroup>
						<DropdownMenuLabel className={GROUP_LABEL_CLASS}>
							Personal
						</DropdownMenuLabel>
						<MenuEntry entry={personal} />
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuLabel className={GROUP_LABEL_CLASS}>
							Your Startups
						</DropdownMenuLabel>
						{startups.map((entry) => (
							<MenuEntry key={entry.key} entry={entry} />
						))}
						<DropdownMenuItem asChild>
							<Link to="/startups/new" className="cursor-pointer gap-2.5">
								<CreateIcon />
								<EntryText label="Create a Startup" description={createHint} />
							</Link>
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	const close = () => setSheetOpen(false);

	return (
		<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
			<SheetTrigger asChild>{trigger}</SheetTrigger>
			<SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Switch workspace</SheetTitle>
				</SheetHeader>
				<div className="flex flex-col px-2 pb-2">
					<p className={GROUP_LABEL_CLASS}>Personal</p>
					<SheetEntry entry={personal} onClick={close} />
					<p className={cn(GROUP_LABEL_CLASS, "mt-2")}>Your Startups</p>
					{startups.map((entry) => (
						<SheetEntry key={entry.key} entry={entry} onClick={close} />
					))}
					<Link
						to="/startups/new"
						onClick={close}
						className={cn(SHEET_ROW_CLASS, "text-muted-foreground")}
					>
						<CreateIcon />
						<EntryText label="Create a Startup" description={createHint} />
					</Link>
					<div className="my-1 h-px bg-border" />
					<Link
						to={target("explore")}
						onClick={close}
						className="flex h-11 items-center gap-3 rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
					>
						<Compass className="size-4 shrink-0" />
						Explore startups, hackathons and people
					</Link>
				</div>
				<AccountFooter onDone={close} />
			</SheetContent>
		</Sheet>
	);
}

function UserAvatar({
	user,
	className,
}: {
	readonly user: AvatarUser | null | undefined;
	readonly className?: string;
}) {
	return (
		<Avatar className={cn("size-6 rounded-full", className)}>
			{user?.image ? <AvatarImage src={user.image} alt="" /> : null}
			<AvatarFallback className="rounded-full text-xs">
				{initials(user?.name ?? null, user?.email ?? null)}
			</AvatarFallback>
		</Avatar>
	);
}

function CreateIcon() {
	return (
		<span className={CREATE_ICON_CLASS}>
			<Plus className="size-3.5" />
		</span>
	);
}

function EntryText({
	label,
	description,
}: {
	readonly label: string;
	readonly description?: string | null;
}) {
	return (
		<span className="flex min-w-0 flex-1 flex-col">
			<span className="truncate font-medium">{label}</span>
			{description ? (
				<span className="truncate text-xs text-muted-foreground">
					{description}
				</span>
			) : null}
		</span>
	);
}

function EntryRow({ entry }: { readonly entry: Entry }) {
	return (
		<>
			{entry.avatar}
			<EntryText label={entry.label} description={entry.description} />
			<Check
				className={cn(
					"size-4 shrink-0",
					entry.current ? "opacity-100" : "opacity-0",
				)}
			/>
		</>
	);
}

function MenuEntry({ entry }: { readonly entry: Entry }) {
	return (
		<DropdownMenuItem asChild>
			<Link to={entry.href} className="cursor-pointer gap-2.5">
				<EntryRow entry={entry} />
			</Link>
		</DropdownMenuItem>
	);
}

function SheetEntry({
	entry,
	onClick,
}: {
	readonly entry: Entry;
	readonly onClick: () => void;
}) {
	return (
		<Link
			to={entry.href}
			onClick={onClick}
			className={cn(SHEET_ROW_CLASS, entry.current && "bg-accent")}
		>
			<EntryRow entry={entry} />
		</Link>
	);
}

/** The account items, for phone where the account menu is hidden. */
function AccountFooter({ onDone }: { readonly onDone: () => void }) {
	const { items, username, run } = useAccountItems();
	const rowClass =
		"flex h-11 w-full items-center rounded-md px-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground";

	return (
		<div className="flex flex-col border-t border-border px-2 py-2">
			{items.map((item) => {
				if ("action" in item) {
					return (
						<button
							key={item.label}
							type="button"
							className={rowClass}
							onClick={() => {
								onDone();
								run(item.action);
							}}
						>
							{item.label}
						</button>
					);
				}
				return item.to === "/u/$username" ? (
					<Link
						key={item.label}
						to="/u/$username"
						params={{ username: username ?? "" }}
						onClick={onDone}
						className={rowClass}
					>
						{item.label}
					</Link>
				) : (
					<Link
						key={item.label}
						to={item.to}
						onClick={onDone}
						className={rowClass}
					>
						{item.label}
					</Link>
				);
			})}
		</div>
	);
}
