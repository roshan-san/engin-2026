import { Link } from "@tanstack/react-router";
import {
	CheckIcon,
	ChevronsUpDownIcon,
	Compass,
	HomeIcon,
	PlusIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { PlaceLogo } from "~/components/PlaceLogo";
import { UnreadDot } from "~/components/UnreadDot";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { roleLabel } from "~/features/hiring/jobChips";
import {
	type CurrentPlace,
	currentPlaceView,
	filterPlaces,
	isSamePlace,
	isWaiting,
	othersWaiting,
} from "~/shell/places";
import { usePlaces } from "~/shell/usePlaces";

/** Above this many places the menu gets a search box. */
const SEARCH_FROM = 6;

/** A shortcut between the places you work in; Home explains them all. */
export function PlaceSwitcher({
	place: current,
}: {
	readonly place: CurrentPlace;
}) {
	const places = usePlaces();
	const [query, setQuery] = useState("");
	const menu = useRef<HTMLDivElement>(null);
	const view = places ? currentPlaceView(places, current) : null;
	const count = places ? places.startups.length + places.building.length : 0;
	const shown = places ? filterPlaces(places, query) : null;

	return (
		<DropdownMenu
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					setQuery("");
				}
			}}
		>
			<DropdownMenuTrigger className="flex h-9 min-w-0 max-w-64 items-center gap-2 rounded-md px-1.5 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 data-[state=open]:bg-muted">
				{view ? (
					<>
						<PlaceLogo name={view.logoName} url={view.logoUrl} size="sm" />
						<span className="flex min-w-0 flex-col leading-tight">
							<span className="truncate text-sm font-medium">{view.name}</span>
							<span className="hidden truncate text-[11px] text-muted-foreground sm:block">
								{view.role}
							</span>
						</span>
					</>
				) : places ? (
					<>
						<HomeIcon aria-hidden className="size-4 text-muted-foreground" />
						<span className="text-sm font-medium">Home</span>
					</>
				) : (
					<>
						<Skeleton aria-hidden className="size-6 shrink-0" />
						<Skeleton aria-hidden className="h-4 w-24" />
					</>
				)}
				{places && othersWaiting(places, current) ? <UnreadDot /> : null}
				<ChevronsUpDownIcon
					aria-hidden
					className="size-3.5 shrink-0 text-muted-foreground"
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent ref={menu} align="start" className="w-72">
				{count >= SEARCH_FROM ? (
					<div className="p-1">
						<Input
							autoFocus
							aria-label="Find a place"
							placeholder="Find a place…"
							value={query}
							className="h-8"
							onChange={(event) => setQuery(event.target.value)}
							onKeyDown={(event) => {
								// Radix typeahead would steal the letters, so keep keys here,
								// except the two that lead to the rows.
								event.stopPropagation();
								const rows = menu.current?.querySelectorAll<HTMLElement>(
									'[data-place-row][role="menuitem"]',
								);
								if (event.key === "ArrowDown" && rows?.length) {
									event.preventDefault();
									rows[0].focus();
								} else if (event.key === "Enter" && rows?.length) {
									event.preventDefault();
									rows[0].click();
								}
							}}
						/>
					</div>
				) : null}
				{shown?.startups.length ? (
					<>
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							Your startups
						</DropdownMenuLabel>
						{shown.startups.map((startup) => (
							<DropdownMenuItem
								key={startup.startupId}
								asChild
								className="cursor-pointer gap-2"
							>
								<Link
									to="/s/$slug/board"
									params={{ slug: startup.slug }}
									data-place-row
									aria-current={
										isSamePlace(
											{ kind: "startup", slug: startup.slug },
											current,
										)
											? "page"
											: undefined
									}
								>
									<PlaceLogo
										name={startup.name}
										url={startup.logoUrl}
										size="sm"
									/>
									<span className="truncate">{startup.name}</span>
									<span className="ml-auto flex shrink-0 items-center gap-2">
										{isWaiting(startup) ? <UnreadDot /> : null}
										{isSamePlace(
											{ kind: "startup", slug: startup.slug },
											current,
										) ? (
											<CheckIcon aria-hidden className="size-4" />
										) : null}
									</span>
								</Link>
							</DropdownMenuItem>
						))}
					</>
				) : null}
				{shown?.building.length ? (
					<>
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							Building in
						</DropdownMenuLabel>
						{shown.building.map((hackathon) => (
							<DropdownMenuItem
								key={hackathon.hackathonId}
								asChild
								className="cursor-pointer gap-2"
							>
								<Link
									to="/h/$id"
									params={{ id: hackathon.hackathonId }}
									data-place-row
									aria-current={
										isSamePlace(
											{ kind: "hackathon", hackathonId: hackathon.hackathonId },
											current,
										)
											? "page"
											: undefined
									}
								>
									<PlaceLogo
										name={hackathon.startupName}
										url={hackathon.startupLogoUrl}
										size="sm"
									/>
									<span className="truncate">
										{roleLabel(hackathon.job.role)} · {hackathon.startupName}
									</span>
									<span className="ml-auto flex shrink-0 items-center gap-2">
										{isWaiting(hackathon) ? <UnreadDot /> : null}
										{isSamePlace(
											{
												kind: "hackathon",
												hackathonId: hackathon.hackathonId,
											},
											current,
										) ? (
											<CheckIcon aria-hidden className="size-4" />
										) : null}
									</span>
								</Link>
							</DropdownMenuItem>
						))}
					</>
				) : null}
				{query &&
				shown &&
				shown.startups.length + shown.building.length === 0 ? (
					<p className="px-2 py-3 text-sm text-muted-foreground">
						No place matches.
					</p>
				) : null}
				{count > 0 ? <DropdownMenuSeparator /> : null}
				<DropdownMenuItem asChild className="cursor-pointer">
					<Link to="/home">
						<HomeIcon aria-hidden />
						Home
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className="cursor-pointer">
					<Link to="/onboarding">
						<PlusIcon aria-hidden />
						New startup
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className="cursor-pointer">
					<Link to="/explore/hackathons">
						<Compass aria-hidden />
						Find a hackathon
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
