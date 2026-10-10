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
import { ShipDialog } from "../cards/ShipDialog";
import { Board } from "./Board";
import { CycleHeader } from "./CycleHeader";
import type { CardView } from "./types";

const boardRoute = getRouteApi("/_shell/_authed/s/$slug/board");

/** The Startup's workspace: the Cycle header, the Board and the Threads panel. */
export function WorkspacePage() {
	const [isPanelOpen, setIsPanelOpen] = useState(false);
	const [shipping, setShipping] = useState<CardView | null>(null);
	const navigate = boardRoute.useNavigate();

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex items-start gap-3 border-b border-border px-4 py-3 md:px-6">
				<CycleHeader />
				<Button
					variant="outline"
					size="sm"
					className="ml-auto shrink-0 md:hidden"
					onClick={() => setIsPanelOpen(true)}
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
						onOpen={(cardId) => void navigate({ search: { card: cardId } })}
					/>
				</div>
				<aside
					data-testid="panel"
					className="hidden w-[380px] shrink-0 flex-col border-l border-border md:flex"
				/>
			</div>
			{shipping ? (
				<ShipDialog card={shipping} onClose={() => setShipping(null)} />
			) : null}
			<Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
				<SheetContent side="bottom" className="h-[85dvh]">
					<SheetHeader>
						<SheetTitle>Threads</SheetTitle>
						<SheetDescription className="sr-only">
							Talk with your team.
						</SheetDescription>
					</SheetHeader>
				</SheetContent>
			</Sheet>
		</div>
	);
}
