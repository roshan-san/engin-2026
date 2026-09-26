import type { Id } from "@convex/_generated/dataModel";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftRight, Check, Plus } from "lucide-react";
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
import { useWorkspace } from "~/features/app/hooks/useWorkspace";
import { cn } from "~/lib/utils";

export function StartupSwitcher() {
	const navigate = useNavigate();
	const { active, startups, isLoading, setActiveStartup } = useWorkspace();

	if (isLoading) {
		return <Skeleton className="h-8 w-24 rounded-md" />;
	}

	if (startups.length === 0) {
		return (
			<Button
				asChild
				variant="ghost"
				size="sm"
				className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
			>
				<Link to="/app/startups/new">
					<Plus className="size-3.5" />
					<span className="hidden sm:inline">Create startup</span>
				</Link>
			</Button>
		);
	}

	const activeId = active?.startup._id;

	function handleSelect(startupId: Id<"startups">) {
		if (startupId !== activeId) {
			void setActiveStartup(startupId);
		}
		void navigate({ to: "/app" });
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="group h-8 max-w-40 gap-1.5 px-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground sm:max-w-52"
				>
					<ArrowLeftRight className="size-3.5 shrink-0 opacity-60 transition-transform duration-300 group-hover:rotate-180 group-data-[state=open]:rotate-180" />
					<span className="truncate font-medium">
						{active?.startup.name ?? "Select startup"}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				{startups.map(({ startup, role }) => (
					<DropdownMenuItem
						key={startup._id}
						className="flex cursor-pointer items-center justify-between gap-2"
						onClick={() => handleSelect(startup._id)}
					>
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium">{startup.name}</p>
							<Badge variant="secondary" className="mt-0.5 text-xs">
								{role}
							</Badge>
						</div>
						<Check
							className={cn(
								"size-4 shrink-0 transition-opacity",
								startup._id === activeId ? "opacity-100" : "opacity-0",
							)}
						/>
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link to="/app/startups/new" className="cursor-pointer">
						<Plus className="size-4" />
						Create startup
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
