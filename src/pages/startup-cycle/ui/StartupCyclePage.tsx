import { getRouteApi } from "@tanstack/react-router";
import { useTeamThread } from "~/entities/message";
import { useWorkspace } from "~/entities/startup";
import { AppPage } from "~/shared/ui/AppPage";
import { Button } from "~/shared/ui/button";
import { DetailPanel } from "~/shared/ui/DetailPanel";
import { UnreadDot } from "~/shared/ui/UnreadDot";
import { useDetailPanel } from "~/shared/ui/useDetailPanel";
import { Board, CardBoard, OpenCardPanel } from "~/widgets/card-board";
import { TeamPanel } from "~/widgets/chat-panel";
import { CycleHeader } from "./CycleHeader";

const cycleRoute = getRouteApi("/_shell/_authed/s/$slug/cycle");

/** The Startup's home: this week's Board, beside the side panel. */
export function StartupCyclePage() {
	const { card: cardId } = cycleRoute.useSearch();
	const navigate = cycleRoute.useNavigate();
	const { startup } = useWorkspace();
	const isTeamUnread = useTeamThread(startup._id)?.unread ?? false;

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
				<h1 className="sr-only">Cycle</h1>
				<Board />
			</AppPage>
		</CardBoard>
	);
}
