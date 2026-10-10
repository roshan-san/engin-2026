import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { MentorNote } from "~/components/shared/MentorNote";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { useIsMobile } from "~/hooks/use-mobile";
import { CardPanel } from "../cards/CardPanel";
import { ShipDialog } from "../cards/ShipDialog";
import { Board } from "./Board";
import { CycleHeader } from "./CycleHeader";
import type { CardView } from "./types";

const boardRoute = getRouteApi("/_shell/_authed/s/$slug/board");

/** The Startup's workspace: the Cycle header, the Board and the side panel. */
export function WorkspacePage() {
	const [isThreadsOpen, setIsThreadsOpen] = useState(false);
	const [shipping, setShipping] = useState<CardView | null>(null);
	const { card: cardId } = boardRoute.useSearch();
	const navigate = boardRoute.useNavigate();
	const isMobile = useIsMobile();

	function closeCard() {
		void navigate({ search: (prev) => ({ ...prev, card: undefined }) });
	}

	// Opening a Card on a phone raises the sheet; the sheet closing closes the Card.
	const isSheetOpen = isMobile && (isThreadsOpen || cardId !== undefined);
	const panel = cardId ? (
		<CardPanel
			key={cardId}
			cardId={cardId}
			onClose={closeCard}
			onShip={setShipping}
		/>
	) : (
		<div className="p-4">
			<MentorNote>Open a Card to see it here.</MentorNote>
		</div>
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex items-start gap-3 border-b border-border px-4 py-3 md:px-6">
				<CycleHeader />
				<Button
					variant="outline"
					size="sm"
					className="ml-auto shrink-0 md:hidden"
					onClick={() => setIsThreadsOpen(true)}
				>
					Threads
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
					{isMobile ? null : panel}
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
					{isMobile ? panel : null}
				</SheetContent>
			</Sheet>
		</div>
	);
}
