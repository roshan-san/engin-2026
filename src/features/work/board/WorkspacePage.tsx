import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { PanelHeader } from "~/components/PanelHeader";
import { UnreadDot } from "~/components/UnreadDot";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { useHeartbeat } from "~/features/chat/useHeartbeat";
import { useTeamThread } from "~/features/chat/useTeamThread";
import { TeamPanel } from "~/features/chat/TeamPanel";
import { useIsMobile } from "~/lib/use-mobile";
import { CardPanel } from "../cards/CardPanel";
import { ShipDialog } from "../cards/ShipDialog";
import { Board } from "./Board";
import { CycleHeader } from "./CycleHeader";
import { useWorkspace } from "./StartupContext";
import type { CardView } from "./types";

const boardRoute = getRouteApi("/_shell/_authed/s/$slug/board");

/** The Startup's workspace: the Cycle header and the Board, beside the side panel. */
export function WorkspacePage() {
	const [isThreadsOpen, setIsThreadsOpen] = useState(false);
	const [shipping, setShipping] = useState<CardView | null>(null);
	const { card: cardId } = boardRoute.useSearch();
	const navigate = boardRoute.useNavigate();
	const isMobile = useIsMobile();
	const { startup } = useWorkspace();
	const isTeamUnread = useTeamThread(startup._id)?.unread ?? false;

	// Online for as long as the workspace is open, whichever panel is showing.
	useHeartbeat(startup._id);

	function closeCard() {
		void navigate({ search: (prev) => ({ ...prev, card: undefined }) });
	}

	// On a phone the sheet stays open and switches to Threads.
	function backToThreads() {
		setIsThreadsOpen(true);
		closeCard();
	}

	function closeSheet() {
		setIsThreadsOpen(false);
		if (cardId) closeCard();
	}

	// Opening a Card on a phone raises the sheet; the sheet closing closes the Card.
	// The panel waits for `isMobile`, so a phone never mounts it in the hidden aside.
	const isSheetOpen =
		isMobile === true && (isThreadsOpen || cardId !== undefined);
	const onClose = isMobile ? closeSheet : undefined;
	const panel = cardId ? (
		<CardPanel
			key={cardId}
			cardId={cardId}
			backLabel="Threads"
			isBackUnread={isTeamUnread}
			onBack={isMobile ? backToThreads : closeCard}
			onClose={onClose}
			onShip={setShipping}
		/>
	) : (
		<TeamPanel onClose={onClose} />
	);

	return (
		<div className="flex h-full min-h-0">
			<div className="flex min-h-0 min-w-0 flex-1 flex-col">
				<PanelHeader className="gap-3 md:px-6">
					<CycleHeader />
					<Button
						variant="ghost"
						size="sm"
						className="shrink-0 md:hidden"
						onClick={() => setIsThreadsOpen(true)}
					>
						Threads
						{isTeamUnread ? <UnreadDot /> : null}
					</Button>
				</PanelHeader>
				<div
					data-testid="board"
					className="flex min-h-0 min-w-0 flex-1 flex-col"
				>
					<Board
						openCardId={cardId}
						onShip={setShipping}
						onOpen={(id) => void navigate({ search: { card: id } })}
						onClose={closeCard}
					/>
				</div>
			</div>
			<aside
				data-testid="panel"
				className="hidden w-[380px] shrink-0 flex-col border-l border-border md:flex"
			>
				{isMobile === false ? panel : null}
			</aside>
			{shipping ? (
				<ShipDialog card={shipping} onClose={() => setShipping(null)} />
			) : null}
			<Sheet
				open={isSheetOpen}
				onOpenChange={(isOpen) => {
					if (!isOpen) closeSheet();
				}}
			>
				<SheetContent
					side="bottom"
					className="h-[85dvh] gap-0"
					showCloseButton={false}
				>
					<SheetHeader className="sr-only">
						<SheetTitle>{cardId ? "Card" : "Threads"}</SheetTitle>
						<SheetDescription>
							{cardId ? "Edit this Card." : "Talk with your team."}
						</SheetDescription>
					</SheetHeader>
					{isMobile === true ? panel : null}
				</SheetContent>
			</Sheet>
		</div>
	);
}
