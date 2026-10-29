import { getRouteApi } from "@tanstack/react-router";
import { TeamPanel, useHeartbeat, useTeamThread } from "~/features/chat";
import { useWorkspace } from "~/features/startups";
import { AppPage } from "~/shared/ui/AppPage";
import { Button } from "~/shared/ui/button";
import { DetailPanel } from "~/shared/ui/DetailPanel";
import { UnreadDot } from "~/shared/ui/UnreadDot";
import { useDetailPanel } from "~/shared/ui/useDetailPanel";
import { OpenCardPanel } from "../cards/OpenCardPanel";
import { Board } from "./Board";
import { CardBoard } from "./CardBoard";
import { CycleHeader } from "./CycleHeader";

const boardRoute = getRouteApi("/_shell/_authed/s/$slug/board");

/** The Startup's workspace: the Cycle header and the Board, beside the side panel. */
export function WorkspacePage() {
	const { card: cardId } = boardRoute.useSearch();
	const navigate = boardRoute.useNavigate();
	const { startup } = useWorkspace();
	const isTeamUnread = useTeamThread(startup._id)?.unread ?? false;

	// Online for as long as the workspace is open, whichever panel is showing.
	useHeartbeat(startup._id);

	function setCard(card: string | undefined) {
		void navigate({ search: (prev) => ({ ...prev, card }) });
	}

	const panel = useDetailPanel(cardId !== undefined, () => setCard(undefined));
	const onClose = panel.isMobile ? panel.close : undefined;

	return (
		<CardBoard cardId={cardId} onCardChange={setCard}>
			<AppPage
				width="full"
				bar={{
					title: <CycleHeader />,
					actions: (
						<Button
							variant="ghost"
							size="sm"
							className="md:hidden"
							onClick={panel.open}
						>
							Threads
							{isTeamUnread ? <UnreadDot /> : null}
						</Button>
					),
				}}
				panel={
					<DetailPanel
						shows={panel.shows}
						title={cardId ? "Card" : "Threads"}
						description={cardId ? "Edit this Card." : "Talk with your team."}
						onClose={panel.close}
						item={
							<OpenCardPanel
								backLabel="Threads"
								isBackUnread={isTeamUnread}
								onBack={panel.back}
								onClose={onClose}
							/>
						}
						fallback={<TeamPanel onClose={onClose} />}
					/>
				}
			>
				<h1 className="sr-only">Board</h1>
				<Board />
			</AppPage>
		</CardBoard>
	);
}
