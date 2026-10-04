import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { useFocusedStartup } from "~/shell/hooks/useFocusedStartup";
import { StartupAvatar } from "~/shell/sidebar/StartupAvatar";

/**
 * The Startup switcher (UI E1): loading skeleton, "Create Startup" when the
 * caller has no Startups, or a dropdown listing every membership. Selecting a
 * Startup only navigates — the /s/$slug layout's effect (01-04) writes focus.
 */
export function StartupSwitcher() {
	const navigate = useNavigate();
	const { memberships, focused, isLoading } = useFocusedStartup();

	if (isLoading) {
		return <Skeleton className="h-8 w-24 rounded-md" />;
	}

	if (memberships.length === 0) {
		return (
			<Button
				asChild
				variant="ghost"
				size="sm"
				className="h-8 w-full justify-start gap-1.5 px-2 text-muted-foreground hover:text-foreground"
			>
				<Link to="/startups/new">
					<Plus className="size-3.5" />
					Create Startup
				</Link>
			</Button>
		);
	}

	const focusedId = focused?.startup._id;

	function handleSelect(slug: string) {
		void navigate({ to: "/s/$slug/cycles", params: { slug } });
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-full justify-start gap-1.5 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
				>
					{focused ? <StartupAvatar name={focused.startup.name} /> : null}
					<span className="min-w-0 flex-1 truncate text-left font-medium">
						{focused?.startup.name ?? "Select Startup"}
					</span>
					<ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-60 max-h-80 overflow-y-auto"
			>
				{memberships.map(({ startup, role, isFocused }) => (
					<DropdownMenuItem
						key={startup._id}
						className="flex cursor-pointer items-center gap-2"
						onClick={() => handleSelect(startup.slug)}
					>
						<StartupAvatar name={startup.name} />
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium">{startup.name}</p>
						</div>
						<Badge variant="secondary" className="shrink-0 text-xs">
							{role}
						</Badge>
						<Check
							className={cn(
								"size-4 shrink-0 transition-opacity",
								startup._id === focusedId || isFocused
									? "opacity-100"
									: "opacity-0",
							)}
						/>
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link to="/startups/new" className="cursor-pointer">
						<Plus className="size-4" />
						Create Startup
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
