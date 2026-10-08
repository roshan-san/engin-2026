import { Link, useRouterState } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Compass, Plus, User } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Badge } from "~/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
import { useIsMobile } from "~/hooks/use-mobile";
import { cn } from "~/lib/utils";
import { useAccountItems } from "~/shell/account/AccountMenu";
import {
	buildSwitchTarget,
	type ShellContext,
	type SwitchTarget,
} from "~/shell/context";
import { useFocusedStartup } from "~/shell/hooks/useFocusedStartup";
import { StartupAvatar } from "~/shell/topbar/StartupAvatar";

type Entry = {
	readonly key: string;
	readonly href: string;
	readonly label: string;
	readonly icon: ReactNode;
	readonly badge?: string;
	readonly current: boolean;
};

const ICON_CLASS = "size-6 shrink-0 p-1 text-muted-foreground";

/**
 * Picks where you are: You, one of your Startups, or Explore. A dropdown on
 * desktop, a bottom sheet on phone (with the account items in its footer).
 * It only navigates; the /s/$slug layout still writes focus.
 */
export function ContextSwitcher({
	context,
}: {
	readonly context: ShellContext;
}) {
	const isMobile = useIsMobile();
	const [sheetOpen, setSheetOpen] = useState(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { memberships } = useFocusedStartup();

	const currentStartup =
		context.kind === "startup"
			? memberships.find((m) => m.startup.slug === context.slug)
			: undefined;
	const label = currentStartup
		? currentStartup.startup.name
		: context.kind === "you"
			? "You"
			: context.kind === "explore"
				? "Explore"
				: "Engin";

	const target = (to: SwitchTarget) =>
		buildSwitchTarget({ pathname, target: to });
	const entries: Entry[] = [
		{
			key: "you",
			href: target("you"),
			label: "You",
			icon: <User className={ICON_CLASS} />,
			current: context.kind === "you",
		},
		...memberships.map(({ startup, role }) => ({
			key: startup._id,
			href: target({ slug: startup.slug }),
			label: startup.name,
			icon: <StartupAvatar name={startup.name} className="shrink-0" />,
			badge: role,
			current: startup._id === currentStartup?.startup._id,
		})),
		{
			key: "explore",
			href: target("explore"),
			label: "Explore",
			icon: <Compass className={ICON_CLASS} />,
			current: context.kind === "explore",
		},
	];

	const trigger = (
		<button
			type="button"
			aria-label={`Switch context, current: ${label}`}
			className="flex h-8 min-w-0 max-w-full items-center gap-2 rounded-md px-1.5 text-sm font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60"
		>
			{currentStartup ? (
				<StartupAvatar
					name={currentStartup.startup.name}
					className="shrink-0"
				/>
			) : null}
			<span className="min-w-0 truncate">{label}</span>
			<ChevronsUpDown className="size-3.5 shrink-0 text-subtle-foreground" />
		</button>
	);

	if (!isMobile) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
				<DropdownMenuContent
					align="start"
					className="max-h-96 w-64 overflow-y-auto"
				>
					{entries.map((entry) => (
						<DropdownMenuItem key={entry.key} asChild>
							<Link to={entry.href} className="cursor-pointer">
								<EntryRow entry={entry} />
							</Link>
						</DropdownMenuItem>
					))}
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<Link to="/startups/new" className="cursor-pointer">
							<Plus className={ICON_CLASS} />
							Create a Startup
						</Link>
					</DropdownMenuItem>
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
					<SheetTitle>Switch context</SheetTitle>
				</SheetHeader>
				<div className="flex flex-col px-2 pb-2">
					{entries.map((entry) => (
						<Link
							key={entry.key}
							to={entry.href}
							onClick={close}
							className="flex h-11 items-center gap-2 rounded-md px-2 text-sm hover:bg-accent"
						>
							<EntryRow entry={entry} />
						</Link>
					))}
					<div className="my-1 h-px bg-border" />
					<Link
						to="/startups/new"
						onClick={close}
						className="flex h-11 items-center gap-2 rounded-md px-2 text-sm hover:bg-accent"
					>
						<Plus className={ICON_CLASS} />
						Create a Startup
					</Link>
				</div>
				<AccountFooter onDone={close} />
			</SheetContent>
		</Sheet>
	);
}

function EntryRow({ entry }: { readonly entry: Entry }) {
	return (
		<>
			{entry.icon}
			<span className="min-w-0 flex-1 truncate">{entry.label}</span>
			{entry.badge ? (
				<Badge variant="secondary" className="shrink-0 text-xs">
					{entry.badge}
				</Badge>
			) : null}
			<Check
				className={cn(
					"size-4 shrink-0",
					entry.current ? "opacity-100" : "opacity-0",
				)}
			/>
		</>
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
