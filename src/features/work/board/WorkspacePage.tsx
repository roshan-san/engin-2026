import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { DetailPanel } from "~/components/DetailPanel";
import { PageBar } from "~/components/PageBar";
import { UnreadDot } from "~/components/UnreadDot";
import { Button } from "~/components/ui/button";
import { useDetailPanel } from "~/components/useDetailPanel";
import { TeamPanel } from "~/features/chat/TeamPanel";
import { useHeartbeat } from "~/features/chat/useHeartbeat";
import { useTeamThread } from "~/features/chat/useTeamThread";
import { CardPanel } from "../cards/CardPanel";
import { ShipDialog } from "../cards/ShipDialog";
import { Board } from "./Board";
import { CycleHeader } from "./CycleHeader";
import { useWorkspace } from "./StartupContext";
import type { CardView } from "./types";

const boardRoute = getRouteApi("/_shell/_authed/s/$slug/board");

/** The Startup's workspace: the Cycle header and the Board, beside the side panel. */
export function WorkspacePage() {
	const [shipping, setShipping] = useState<CardView | null>(null);
	const { card: cardId } = boardRoute.useSearch();
	const navigate = boardRoute.useNavigate();
	const { startup } = useWorkspace();
	const isTeamUnread = useTeamThread(startup._id)?.unread ?? false;

	// Online for as long as the workspace is open, whichever panel is showing.
	useHeartbeat(startup._id);

	function closeCard() {
		void navigate({ search: (prev) => ({ ...prev, card: undefined }) });
	}

	const panel = useDetailPanel(cardId !== undefined, closeCard);
	const onClose = panel.isMobile ? panel.close : undefined;

	return (
		<div className="flex h-full min-h-0">
			<div className="flex min-h-0 min-w-0 flex-1 flex-col">
				<PageBar
					title={<CycleHeader />}
					actions={
						<Button
							variant="ghost"
							size="sm"
							className="md:hidden"
							onClick={panel.open}
						>
							Threads
							{isTeamUnread ? <UnreadDot /> : null}
						</Button>
					}
				/>
				<div className="flex min-h-0 min-w-0 flex-1 flex-col">
					<Board
						openCardId={cardId}
						onShip={setShipping}
						onOpen={(id) => void navigate({ search: { card: id } })}
						onClose={closeCard}
					/>
				</div>
			</div>
			<DetailPanel
				shows={panel.shows}
				title={cardId ? "Card" : "Threads"}
				description={cardId ? "Edit this Card." : "Talk with your team."}
				onClose={panel.close}
				item={
					cardId ? (
						<CardPanel
							key={cardId}
							cardId={cardId}
							backLabel="Threads"
							isBackUnread={isTeamUnread}
							onBack={panel.back}
							onClose={onClose}
							onShip={setShipping}
						/>
					) : null
				}
				fallback={<TeamPanel onClose={onClose} />}
			/>
			{shipping ? (
				<ShipDialog card={shipping} onClose={() => setShipping(null)} />
			) : null}
		</div>
	);
}
