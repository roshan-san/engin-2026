import type { Id } from "@convex/_generated/dataModel";
import { getRouteApi, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GlobalNotFound } from "~/components/globals/GlobalNotFound";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { PanelHeader } from "~/components/shared/PanelHeader";
import { Segmented } from "~/components/shared/Segmented";
import { UnreadDot } from "~/components/shared/UnreadDot";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { ThreadPanel } from "~/features/chat/threads/ThreadPanel";
import { Board } from "~/features/work/board/Board";
import {
	type BoardScope,
	BoardScopeContext,
} from "~/features/work/board/BoardScope";
import { useMe } from "~/features/work/board/hooks/useMe";
import type { CardView } from "~/features/work/board/types";
import { CardPanel } from "~/features/work/cards/CardPanel";
import { ShipDialog } from "~/features/work/cards/ShipDialog";
import { useIsMobile } from "~/hooks/use-mobile";
import { jobLine } from "../jobChips";
import { useHackathon } from "../public/hooks/useHackathon";
import { useHackathonThreads } from "../space/hooks/useSpace";
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
		return <GlobalSpinner />;
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
	const { card: cardId, thread = "everyone" } = route.useSearch();
	const navigate = route.useNavigate();
	const isMobile = useIsMobile();
	const [isPanelOpen, setIsPanelOpen] = useState(false);
	const [shipping, setShipping] = useState<CardView | null>(null);
	const threads = useHackathonThreads(page._id);
	const everyone = threads?.find((t) => t.kind === "everyone");
	const founder = threads?.find((t) => t.kind === "private");
	const current = thread === "founder" ? founder : everyone;
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

	const onClose = isMobile
		? () => {
				setIsPanelOpen(false);
				if (cardId) closeCard();
			}
		: undefined;

	const switcher = (
		<Segmented
			label="Thread"
			options={[
				{
					value: "everyone",
					label: (
						<>
							Everyone
							{everyone?.unread && thread !== "everyone" ? <UnreadDot /> : null}
						</>
					),
				},
				{
					value: "founder",
					label: (
						<>
							Founder
							{founder?.unread && thread !== "founder" ? <UnreadDot /> : null}
						</>
					),
				},
			]}
			value={thread}
			onChange={(next) =>
				void navigate({ search: (prev) => ({ ...prev, thread: next }) })
			}
		/>
	);

	const panel = cardId ? (
		<CardPanel
			key={cardId}
			cardId={cardId}
			backLabel="Threads"
			isBackUnread={isAnyUnread}
			onBack={closeCard}
			onClose={onClose}
			onShip={setShipping}
		/>
	) : (
		<ThreadPanel
			key={thread}
			threadId={current?._id}
			title={switcher}
			userId={userId}
			placeholder={
				thread === "founder" ? "Message the Founder" : "Ask Everyone"
			}
			emptyNote={
				thread === "founder"
					? "Only you and the Founder see this."
					: "Ask here. Everyone sees it."
			}
			isReadOnly={page.status === "done"}
			onClose={onClose}
		/>
	);

	return (
		<BoardScopeContext.Provider value={scope}>
			<div className="flex h-[calc(100dvh-3.5rem-1px)] min-h-0">
				<div className="flex min-h-0 min-w-0 flex-1 flex-col">
					<PanelHeader className="gap-3 md:px-6">
						<h1 className="truncate text-sm font-medium">
							{jobLine(page.job)}
							<span className="font-normal text-muted-foreground">
								{" "}
								at {page.startup.name}
							</span>
						</h1>
						<span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">
							{status.line}
						</span>
						<Button
							variant="ghost"
							size="sm"
							className="ml-auto shrink-0 md:hidden"
							onClick={() => setIsPanelOpen(true)}
						>
							Threads
							{isAnyUnread ? <UnreadDot /> : null}
						</Button>
					</PanelHeader>
					{page.myApplication?.decision ? (
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
					) : null}
					<Board
						openCardId={cardId}
						onShip={setShipping}
						onOpen={(id) =>
							void navigate({ search: (prev) => ({ ...prev, card: id }) })
						}
						onClose={closeCard}
					/>
				</div>
				<aside className="hidden w-[380px] shrink-0 flex-col border-l border-border md:flex">
					{isMobile === false ? panel : null}
				</aside>
				{shipping ? (
					<ShipDialog card={shipping} onClose={() => setShipping(null)} />
				) : null}
				<Sheet
					open={isMobile === true && (isPanelOpen || cardId !== undefined)}
					onOpenChange={(isOpen) => {
						if (!isOpen) onClose?.();
					}}
				>
					<SheetContent
						side="bottom"
						className="h-[85dvh] gap-0"
						showCloseButton={false}
					>
						<SheetHeader className="sr-only">
							<SheetTitle>{cardId ? "Card" : "Threads"}</SheetTitle>
							<SheetDescription>Talk with the Founder.</SheetDescription>
						</SheetHeader>
						{isMobile === true ? panel : null}
					</SheetContent>
				</Sheet>
			</div>
		</BoardScopeContext.Provider>
	);
}
