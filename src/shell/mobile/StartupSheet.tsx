import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { useFocusedStartup } from "~/shell/hooks/useFocusedStartup";
import { STARTUP_NAV } from "~/shell/nav";
import { StartupAvatar } from "~/shell/sidebar/StartupAvatar";

type StartupSheetProps = {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
};

/**
 * Mobile twin of the desktop nav's Focused-Startup section (D-15): the
 * switcher row at the top, then Cycles/Hiring/Team/Pitch/Activity, or just
 * "Create a Startup" when there is none. Built from the raw Sheet primitive —
 * no shadcn desktop-nav mobile mode.
 */
export function StartupSheet({ open, onOpenChange }: StartupSheetProps) {
	const navigate = useNavigate();
	const { memberships, focused, isLoading } = useFocusedStartup();
	const [listOpen, setListOpen] = useState(false);

	function close() {
		setListOpen(false);
		onOpenChange(false);
	}

	function handleSelect(slug: string) {
		void navigate({ to: "/s/$slug/cycles", params: { slug } });
		close();
	}

	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				if (!next) setListOpen(false);
				onOpenChange(next);
			}}
		>
			<SheetContent side="bottom" className="max-h-svh overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Startup</SheetTitle>
				</SheetHeader>
				<div className="flex flex-col gap-1 px-4 pb-4">
					{isLoading ? (
						<Skeleton className="h-8 w-24 rounded-md" />
					) : memberships.length === 0 ? (
						<Link
							to="/startups/new"
							onClick={close}
							className="flex h-11 items-center gap-2 text-muted-foreground"
						>
							<Plus className="size-4" />
							Create a Startup
						</Link>
					) : (
						<>
							<button
								type="button"
								onClick={() => setListOpen((prev) => !prev)}
								className="flex h-11 w-full items-center gap-2 text-left"
							>
								{focused ? <StartupAvatar name={focused.startup.name} /> : null}
								<span className="min-w-0 flex-1 truncate font-medium">
									{focused?.startup.name ?? "Select Startup"}
								</span>
								<ChevronsUpDown className="size-4 shrink-0 opacity-60" />
							</button>
							{listOpen ? (
								<div className="flex flex-col gap-1 border-y border-border py-1">
									{memberships.map(({ startup, role, isFocused }) => (
										<button
											key={startup._id}
											type="button"
											onClick={() => handleSelect(startup.slug)}
											className="flex h-11 items-center gap-2"
										>
											<StartupAvatar name={startup.name} />
											<span className="min-w-0 flex-1 truncate text-left">
												{startup.name}
											</span>
											<Badge variant="secondary" className="shrink-0 text-xs">
												{role}
											</Badge>
											<Check
												className={cn(
													"size-4 shrink-0",
													startup._id === focused?.startup._id || isFocused
														? "opacity-100"
														: "opacity-0",
												)}
											/>
										</button>
									))}
									<Link
										to="/startups/new"
										onClick={close}
										className="flex h-11 items-center gap-2 text-muted-foreground"
									>
										<Plus className="size-4" />
										Create a Startup
									</Link>
								</div>
							) : null}
							{focused ? (
								<nav className="mt-1 flex flex-col gap-1">
									{STARTUP_NAV.map(({ label, to, icon: Icon }) => (
										<Link
											key={to}
											to={to}
											params={{ slug: focused.startup.slug }}
											onClick={close}
											className="flex h-11 items-center gap-2"
										>
											<Icon className="size-4 text-muted-foreground" />
											{label}
										</Link>
									))}
								</nav>
							) : null}
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
