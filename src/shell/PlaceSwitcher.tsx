import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { UnreadDot } from "~/components/UnreadDot";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { roleLabel } from "~/features/hiring/jobChips";
import { usePlaces } from "~/shell/usePlaces";
import { currentPlace, othersWaiting, placeLabel } from "~/shell/places";

/** The place you're in, and the way to every other: your Startups, the Hackathons you build and applied to. */
export function PlaceSwitcher() {
	const places = usePlaces();
	const current = currentPlace(useLocation().pathname);
	const label = places ? placeLabel(places, current) : "Places";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex h-8 min-w-0 max-w-48 items-center gap-1.5 rounded-md px-2 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 data-[state=open]:bg-muted">
				<span className="truncate">{label}</span>
				<ChevronDownIcon
					aria-hidden
					className="size-4 shrink-0 text-muted-foreground"
				/>
				{places && othersWaiting(places, current) ? <UnreadDot /> : null}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-64">
				{places?.startups.length ? (
					<>
						<DropdownMenuLabel>Startups</DropdownMenuLabel>
						{places.startups.map((startup) => (
							<DropdownMenuItem
								key={startup.startupId}
								asChild
								className="cursor-pointer"
							>
								<Link to="/s/$slug/board" params={{ slug: startup.slug }}>
									<span className="truncate">{startup.name}</span>
									<span className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
										{startup.role === "founder" ? "Founder" : "Contributor"}
										{startup.waiting ? <UnreadDot /> : null}
									</span>
								</Link>
							</DropdownMenuItem>
						))}
					</>
				) : null}
				{places?.building.length ? (
					<>
						<DropdownMenuLabel>Building</DropdownMenuLabel>
						{places.building.map((hackathon) => (
							<DropdownMenuItem
								key={hackathon.hackathonId}
								asChild
								className="cursor-pointer"
							>
								<Link to="/h/$id" params={{ id: hackathon.hackathonId }}>
									<span className="truncate">
										{roleLabel(hackathon.job.role)} · {hackathon.startupName}
									</span>
									{hackathon.waiting ? (
										<span className="ml-auto flex shrink-0">
											<UnreadDot />
										</span>
									) : null}
								</Link>
							</DropdownMenuItem>
						))}
					</>
				) : null}
				{places?.applied.length ? (
					<>
						<DropdownMenuLabel>Applied</DropdownMenuLabel>
						{places.applied.map((hackathon) => (
							<DropdownMenuItem
								key={hackathon.hackathonId}
								asChild
								className="cursor-pointer"
							>
								<Link
									to="/hackathons/$id"
									params={{ id: hackathon.hackathonId }}
								>
									<span className="truncate">
										{roleLabel(hackathon.job.role)} · {hackathon.startupName}
									</span>
									<span className="ml-auto shrink-0 text-xs text-muted-foreground">
										{hackathon.status === "applied"
											? "Applied"
											: "Not this time"}
									</span>
								</Link>
							</DropdownMenuItem>
						))}
					</>
				) : null}
				{places &&
				(places.startups.length ||
					places.building.length ||
					places.applied.length) ? (
					<DropdownMenuSeparator />
				) : null}
				<DropdownMenuItem asChild className="cursor-pointer">
					<Link to="/onboarding">
						<PlusIcon aria-hidden />
						New startup
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
