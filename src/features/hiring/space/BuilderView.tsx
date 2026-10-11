import type { Doc, Id } from "@convex/_generated/dataModel";
import { getRouteApi } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import type { CardView } from "~/features/work/board/types";
import { CardPanel } from "~/features/work/cards/CardPanel";
import { ShipDialog } from "~/features/work/cards/ShipDialog";
import { useIsMobile } from "~/hooks/use-mobile";
import type { ApplicantRow } from "./applicantSort";
import { DecideSheet } from "./DecideSheet";

const route = getRouteApi("/_shell/_authed/s/$slug/hiring/$id");

const PANES = [
	{ value: "thread", label: "Thread" },
	{ value: "decide", label: "Decide" },
] as const;

/** One Builder: their Board, your private thread with them, and the decision. */
export function BuilderView({
	hackathon,
	row,
	threadId,
	isThreadUnread,
	userId,
}: {
	readonly hackathon: Doc<"hackathons">;
	readonly row: ApplicantRow;
	readonly threadId: Id<"threads"> | undefined;
	readonly isThreadUnread: boolean;
	readonly userId: Id<"users">;
}) {
	const [pane, setPane] = useState<"thread" | "decide">("thread");
	const [isPanelOpen, setIsPanelOpen] = useState(false);
	const [shipping, setShipping] = useState<CardView | null>(null);
	const cardId = route.useSearch({ select: (search) => search.card });
	const navigate = route.useNavigate();
	const isMobile = useIsMobile();
	const builderId = row.user._id;
	const isClosed = hackathon.status === "done";

	const scope = useMemo<BoardScope>(
		() => ({
			kind: "builder",
			startupId: hackathon.startupId,
			hackathonId: hackathon._id,
			builderId,
			userId,
			isFounder: true,
			isClosed,
		}),
		[hackathon.startupId, hackathon._id, builderId, userId, isClosed],
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

	const name = row.user.name ?? row.user.username ?? "them";
	const switcher = (
		<Segmented label="Show" options={PANES} value={pane} onChange={setPane} />
	);

	const panel = cardId ? (
		<CardPanel
			key={cardId}
			cardId={cardId}
			backLabel={pane === "decide" ? "Decide" : "Thread"}
			isBackUnread={pane === "thread" && isThreadUnread}
			onBack={closeCard}
			onClose={onClose}
			onShip={setShipping}
		/>
	) : pane === "thread" ? (
		<ThreadPanel
			threadId={threadId}
			title={switcher}
			userId={userId}
			placeholder={`Message ${name}`}
			emptyNote="Only you two see this."
			isReadOnly={isClosed}
			onClose={onClose}
		/>
	) : (
		<div className="flex min-h-0 flex-1 flex-col">
			<PanelHeader>{switcher}</PanelHeader>
			<DecideSheet row={row} hackathon={hackathon} />
		</div>
	);

	return (
		<BoardScopeContext.Provider value={scope}>
			<div className="flex min-h-0 min-w-0 flex-1">
				<div className="flex min-h-0 min-w-0 flex-1 flex-col">
					<PanelHeader className="gap-2 md:hidden">
						<Button
							variant="ghost"
							size="sm"
							className="ml-auto"
							onClick={() => setIsPanelOpen(true)}
						>
							Thread and Decide
							{isThreadUnread ? <UnreadDot /> : null}
						</Button>
					</PanelHeader>
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
							<SheetTitle>{row.user.name ?? "Builder"}</SheetTitle>
							<SheetDescription>Thread, Decide and Cards.</SheetDescription>
						</SheetHeader>
						{isMobile === true ? panel : null}
					</SheetContent>
				</Sheet>
			</div>
		</BoardScopeContext.Provider>
	);
}
