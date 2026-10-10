import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { useHeartbeat } from "~/features/chat/threads/hooks/useHeartbeat";
import { useTeamThread } from "~/features/chat/threads/hooks/useTeamThread";
import { ThreadsPanel } from "~/features/chat/threads/ThreadsPanel";
import { useIsMobile } from "~/hooks/use-mobile";
import { CardPanel } from "../cards/CardPanel";
import { ShipDialog } from "../cards/ShipDialog";
import { Board } from "./Board";
import { CycleHeader } from "./CycleHeader";
import { useWorkspace } from "./StartupContext";
import type { CardView } from "./types";

const boardRoute = getRouteApi("/_shell/_authed/s/$slug/board");

/** The Startup's workspace: the Cycle header, the Board and the side panel. */
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

	// Opening a Card on a phone raises the sheet; the sheet closing closes the Card.
	// The panel waits for `isMobile`, so a phone never mounts it in the hidden aside.
	const isSheetOpen =
		isMobile === true && (isThreadsOpen || cardId !== undefined);
	const panel = cardId ? (
		<>
			<div className="border-b border-border px-2 py-1">
				<Button variant="ghost" size="sm" onClick={backToThreads}>
					Back to Threads
					{isTeamUnread ? <UnreadDot /> : null}
				</Button>
			</div>
			<CardPanel
				key={cardId}
				cardId={cardId}
				onClose={closeCard}
				onShip={setShipping}
			/>
		</>
	) : (
		<ThreadsPanel />
	);

	return (
		<div className="flex h-[calc(100dvh-3.5rem-1px)] min-h-0 flex-col">
			<div className="flex items-start gap-3 border-b border-border px-4 py-3 md:px-6">
				<CycleHeader />
				<Button
					variant="outline"
					size="sm"
					className="ml-auto shrink-0 md:hidden"
					onClick={() => setIsThreadsOpen(true)}
				>
					Threads
					{isTeamUnread ? <UnreadDot /> : null}
				</Button>
			</div>
			<div className="flex min-h-0 flex-1">
				<div
					data-testid="board"
					className="flex min-h-0 min-w-0 flex-1 flex-col"
				>
					<Board
						onShip={setShipping}
						onOpen={(id) => void navigate({ search: { card: id } })}
					/>
				</div>
				<aside
					data-testid="panel"
					className="hidden w-[380px] shrink-0 flex-col border-l border-border md:flex"
				>
					{isMobile === false ? panel : null}
				</aside>
			</div>
			{shipping ? (
				<ShipDialog card={shipping} onClose={() => setShipping(null)} />
			) : null}
			<Sheet
				open={isSheetOpen}
				onOpenChange={(isOpen) => {
					if (isOpen) return;
					setIsThreadsOpen(false);
					if (cardId) closeCard();
				}}
			>
				<SheetContent
					side="bottom"
					className="h-[85dvh]"
					showCloseButton={!cardId}
				>
					<SheetHeader className={cardId ? "sr-only" : undefined}>
						<SheetTitle>{cardId ? "Card" : "Threads"}</SheetTitle>
						<SheetDescription className="sr-only">
							{cardId ? "Edit this Card." : "Talk with your team."}
						</SheetDescription>
					</SheetHeader>
					{isMobile === true ? panel : null}
				</SheetContent>
			</Sheet>
		</div>
	);
}

/** A small dot: Team has messages you haven't read. */
function UnreadDot() {
	return (
		<span
			role="img"
			aria-label="Unread"
			className="size-1.5 rounded-full bg-foreground"
		/>
	);
}
