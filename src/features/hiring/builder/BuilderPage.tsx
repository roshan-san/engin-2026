import type { Id } from "@convex/_generated/dataModel";
import { getRouteApi, Link, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppPage } from "~/components/AppPage";
import { DetailPanel } from "~/components/DetailPanel";
import { GlobalNotFound } from "~/components/GlobalNotFound";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { Segmented } from "~/components/Segmented";
import { UnreadDot } from "~/components/UnreadDot";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useDetailPanel } from "~/components/useDetailPanel";
import { ThreadPanel } from "~/features/chat/ThreadPanel";
import { Board } from "~/features/work/board/Board";
import {
	type BoardScope,
	BoardScopeContext,
} from "~/features/work/board/BoardScope";
import type { CardView } from "~/features/work/board/types";
import { CardPanel } from "~/features/work/cards/CardPanel";
import { ShipDialog } from "~/features/work/cards/ShipDialog";
import { useMe } from "~/shell/useMe";
import { roleLabel } from "../jobChips";
import { useHackathon } from "../public/useHackathon";
import { useHackathonThreads } from "../space/useSpace";
import { BuilderBrief } from "./BuilderBrief";
import { builderStatus } from "./builderStatus";
import { DecisionBanner } from "./DecisionBanner";

const route = getRouteApi("/_shell/_authed/h/$id");

type Hackathon = NonNullable<ReturnType<typeof useHackathon>>;

/** A Builder's own Board on a Hackathon, beside Everyone and the Founder. */
export function BuilderPage() {
	const { id } = route.useParams();
	const page = useHackathon(id);
	const me = useMe();

	if (page === undefined || me === undefined) {
		return <GlobalSpinner fill />;
	}
	if (page === null || me === null) {
		return <GlobalNotFound />;
	}
	if (page.myApplication?.status !== "building") {
		return <Navigate to="/hackathons/$id" params={{ id }} replace />;
	}

	return <BuilderSpace page={page} userId={me._id} />;
}

function BuilderSpace({
	page,
	userId,
}: {
	readonly page: Hackathon;
	readonly userId: Id<"users">;
}) {
	const { card: cardId, panel = "brief" } = route.useSearch();
	const navigate = route.useNavigate();
	const [shipping, setShipping] = useState<CardView | null>(null);
	const threads = useHackathonThreads(page._id);
	const everyone = threads?.find((t) => t.kind === "everyone");
	const founder = threads?.find((t) => t.kind === "private");
	const current = panel === "founder" ? founder : everyone;
	const status = builderStatus(
		page,
		page.myApplication?.decision ?? null,
		Date.now(),
	);
	const { isClosed } = status;
	const isAnyUnread = (everyone?.unread ?? false) || (founder?.unread ?? false);

	const scope = useMemo<BoardScope>(
		() => ({
			kind: "builder",
			hackathonId: page._id,
			builderId: userId,
			userId,
			isFounder: false,
			isClosed,
		}),
		[page._id, userId, isClosed],
	);

	function closeCard() {
		void navigate({ search: (prev) => ({ ...prev, card: undefined }) });
	}

	const detail = useDetailPanel(cardId !== undefined, closeCard);
	const onClose = detail.isMobile ? detail.close : undefined;

	const switcher = (
		<Segmented
			label="Panel"
			options={[
				{ value: "brief", label: "Brief" },
				{
					value: "everyone",
					label: (
						<>
							Everyone
							{everyone?.unread && panel !== "everyone" ? <UnreadDot /> : null}
						</>
					),
				},
				{
					value: "founder",
					label: (
						<>
							Founder
							{founder?.unread && panel !== "founder" ? <UnreadDot /> : null}
						</>
					),
				},
			]}
			value={panel}
			onChange={(next) =>
				void navigate({ search: (prev) => ({ ...prev, panel: next }) })
			}
		/>
	);

	const card = cardId ? (
		<CardPanel
			key={cardId}
			cardId={cardId}
			backLabel={panel === "brief" ? "Brief" : "Threads"}
			isBackUnread={isAnyUnread}
			onBack={detail.back}
			onClose={onClose}
			onShip={setShipping}
		/>
	) : null;
	const own =
		panel === "brief" ? (
			<BuilderBrief hackathon={page} title={switcher} onClose={onClose} />
		) : (
			<ThreadPanel
				key={panel}
				threadId={current?._id}
				title={switcher}
				userId={userId}
				placeholder={
					panel === "founder" ? "Message the Founder" : "Ask Everyone"
				}
				emptyNote={
					panel === "founder"
						? "Only you and the Founder see this."
						: "Ask here. Everyone sees it."
				}
				isReadOnly={page.status === "done"}
				onClose={onClose}
			/>
		);

	return (
		<BoardScopeContext.Provider value={scope}>
			<AppPage
				width="full"
				bar={{
					title: (
						<h1 className="flex min-w-0 items-baseline gap-2 truncate text-sm">
							<span className="font-medium">{roleLabel(page.job.role)}</span>
							<Link
								to="/hackathons/$id"
								params={{ id: page._id }}
								className="truncate text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
							>
								at {page.startup.name}
							</Link>
						</h1>
					),
					badge: (
						<Badge
							variant="status"
							tone={status.isClosed ? "neutral" : "success"}
							className="hidden shrink-0 sm:inline-flex"
						>
							{status.line}
						</Badge>
					),
					actions: (
						<Button
							variant="ghost"
							size="sm"
							className="md:hidden"
							onClick={detail.open}
						>
							Brief and threads
							{isAnyUnread ? <UnreadDot /> : null}
						</Button>
					),
				}}
				notice={
					page.myApplication?.decision ? (
						<DecisionBanner
							application={{
								...page.myApplication,
								decision: page.myApplication.decision,
							}}
						/>
					) : status.note ? (
						<p className="border-b border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground md:px-6">
							{status.note}
						</p>
					) : null
				}
				panel={
					<DetailPanel
						shows={detail.shows}
						title={cardId ? "Card" : "Brief and threads"}
						description="Talk with the Founder."
						onClose={detail.close}
						item={card}
						fallback={own}
					/>
				}
			>
				<Board
					openCardId={cardId}
					onShip={setShipping}
					onOpen={(id) =>
						void navigate({ search: (prev) => ({ ...prev, card: id }) })
					}
					onClose={closeCard}
				/>
				{shipping ? (
					<ShipDialog card={shipping} onClose={() => setShipping(null)} />
				) : null}
			</AppPage>
		</BoardScopeContext.Provider>
	);
}
