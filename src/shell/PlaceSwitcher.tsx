import type { WaitingReason } from "@convex/shared/places";
import { Link, type LinkProps } from "@tanstack/react-router";
import {
	CheckIcon,
	ChevronsUpDownIcon,
	Compass,
	HomeIcon,
	PlusIcon,
	SearchIcon,
} from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
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
import { Skeleton } from "~/components/ui/skeleton";
import { participantStatusText } from "~/features/hiring";
import { roleLabel } from "~/shared/config/jobs";
import { cn } from "~/shared/lib/cn";
import {
	type CurrentPlace,
	currentPlaceView,
	filterPlaces,
	isSamePlace,
	othersWaiting,
	placeHint,
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
	const count = places ? places.startups.length + places.hackathons.length : 0;
	const shown = places ? filterPlaces(places, query) : null;

	return (
		<DropdownMenu
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					setQuery("");
				}
			}}
		>
			<DropdownMenuTrigger className="group flex h-9 min-w-0 max-w-md items-center gap-2 rounded-lg pr-2 pl-1.5 text-left transition-colors hover:bg-muted data-[state=open]:bg-muted focus-ring">
				{view ? (
					<>
						<PlaceLogo name={view.logoName} url={view.logoUrl} size={20} />
						<span className="min-w-0 truncate text-sm font-medium sm:max-w-56">
							{view.name}
						</span>
						<span className="hidden min-w-0 truncate rounded-full border border-border px-2 py-px text-xs text-muted-foreground sm:inline">
							{view.role}
						</span>
					</>
				) : places ? (
					<>
						<HomeIcon aria-hidden className="size-4 text-muted-foreground" />
						<span className="text-sm font-medium">Home</span>
					</>
				) : (
					<>
						<Skeleton aria-hidden className="size-5 shrink-0" />
						<Skeleton aria-hidden className="h-4 w-24" />
					</>
				)}
				{places && othersWaiting(places, current) ? <UnreadDot /> : null}
				<ChevronsUpDownIcon
					aria-hidden
					className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground group-data-[state=open]:text-foreground"
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				ref={menu}
				align="start"
				sideOffset={8}
				className="w-80 p-0"
			>
				{count >= SEARCH_FROM ? (
					<div className="flex items-center gap-2 border-b border-border px-3">
						<SearchIcon
							aria-hidden
							className="size-4 shrink-0 text-muted-foreground"
						/>
						<input
							// biome-ignore lint/a11y/noAutofocus: opening the menu is asking to search.
							autoFocus
							aria-label="Find a place"
							placeholder="Find a place…"
							value={query}
							className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
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
				{count > 0 ? (
					<div className="max-h-[min(26rem,60vh)] overflow-y-auto p-1.5">
						{shown?.startups.length ? (
							<>
								<SectionLabel>Your startups</SectionLabel>
								{shown.startups.map((startup) => (
									<PlaceRow
										key={startup.startupId}
										link={{
											to: "/s/$slug/board",
											params: { slug: startup.slug },
										}}
										name={startup.name}
										logoName={startup.name}
										logoUrl={startup.logoUrl}
										waiting={startup.waiting}
										who={startup.role === "founder" ? "Founder" : "Contributor"}
										isCurrent={isSamePlace(
											{ kind: "startup", slug: startup.slug },
											current,
										)}
									/>
								))}
							</>
						) : null}
						{shown?.hackathons.length ? (
							<>
								<SectionLabel>Your Hackathons</SectionLabel>
								{shown.hackathons.map((hackathon) => (
									<PlaceRow
										key={hackathon.hackathonId}
										link={{
											to: "/h/$id",
											params: { id: hackathon.hackathonId },
										}}
										name={roleLabel(hackathon.job.role)}
										logoName={hackathon.startupName}
										logoUrl={hackathon.startupLogoUrl}
										waiting={hackathon.waiting}
										who={`${hackathon.startupName} · ${participantStatusText(hackathon, hackathon.decision, Date.now())}`}
										isCurrent={isSamePlace(
											{
												kind: "hackathon",
												hackathonId: hackathon.hackathonId,
											},
											current,
										)}
									/>
								))}
							</>
						) : null}
						{query &&
						shown &&
						shown.startups.length + shown.hackathons.length === 0 ? (
							<p className="px-2 py-6 text-center text-sm text-muted-foreground">
								No place matches “{query.trim()}”.
							</p>
						) : null}
					</div>
				) : null}
				{count > 0 ? <DropdownMenuSeparator className="m-0" /> : null}
				<div className="p-1.5">
					<ActionRow to="/home" icon={<HomeIcon aria-hidden />}>
						Home
					</ActionRow>
					<ActionRow to="/onboarding" icon={<PlusIcon aria-hidden />}>
						New startup
					</ActionRow>
					<ActionRow to="/explore/hackathons" icon={<Compass aria-hidden />}>
						Find a hackathon
					</ActionRow>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function SectionLabel({ children }: { readonly children: ReactNode }) {
	return (
		<DropdownMenuLabel className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
			{children}
		</DropdownMenuLabel>
	);
}

/** One place: its logo, its name, and underneath what is waiting on you there or who you are there. */
function PlaceRow({
	link,
	name,
	logoName,
	logoUrl,
	waiting,
	who,
	isCurrent,
}: {
	readonly link: Pick<LinkProps, "to" | "params">;
	readonly name: string;
	readonly logoName: string;
	readonly logoUrl: string | null;
	readonly waiting: readonly WaitingReason[];
	readonly who: string;
	readonly isCurrent: boolean;
}) {
	const hasWaiting = waiting.length > 0;
	return (
		<DropdownMenuItem
			asChild
			className="cursor-pointer gap-3 rounded-lg px-2 py-1.5 aria-[current=page]:bg-accent/60"
		>
			<Link
				{...link}
				data-place-row
				aria-current={isCurrent ? "page" : undefined}
			>
				<PlaceLogo name={logoName} url={logoUrl} size={32} />
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="truncate font-medium">{name}</span>
					<span
						className={cn(
							"truncate text-xs",
							hasWaiting ? "text-link" : "text-muted-foreground",
						)}
					>
						{placeHint(waiting, who)}
					</span>
				</span>
				{isCurrent ? (
					<CheckIcon aria-hidden className="size-4 text-foreground" />
				) : hasWaiting ? (
					<UnreadDot />
				) : null}
			</Link>
		</DropdownMenuItem>
	);
}

/** A way out of the list, its text lined up with the place names above. */
function ActionRow({
	to,
	icon,
	children,
}: {
	readonly to: "/home" | "/onboarding" | "/explore/hackathons";
	readonly icon: ReactNode;
	readonly children: ReactNode;
}) {
	return (
		<DropdownMenuItem
			asChild
			className="cursor-pointer gap-3 rounded-lg px-2 text-muted-foreground focus:text-foreground"
		>
			<Link to={to}>
				<span className="flex w-8 shrink-0 justify-center">{icon}</span>
				{children}
			</Link>
		</DropdownMenuItem>
	);
}
