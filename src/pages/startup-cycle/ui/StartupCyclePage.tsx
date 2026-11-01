import { getRouteApi } from "@tanstack/react-router";
import { useBoardCards, useBoardScope } from "~/entities/card";
import { useCycle } from "~/entities/cycle";
import { useTeamThread } from "~/entities/message";
import { useWorkspace } from "~/entities/startup";
import { ReviewBanner } from "~/features/monday-review";
import { CycleHeader, GoalPrompt } from "~/features/set-cycle-goal";
import { AppPage } from "~/shared/ui/AppPage";
import { Button } from "~/shared/ui/button";
import { DetailPanel } from "~/shared/ui/DetailPanel";
import { Section } from "~/shared/ui/Section";
import { Segmented } from "~/shared/ui/Segmented";
import { UnreadDot } from "~/shared/ui/UnreadDot";
import { useDetailPanel } from "~/shared/ui/useDetailPanel";
import {
	Board,
	CardBoard,
	CycleCards,
	OpenCardPanel,
} from "~/widgets/card-board";
import { TeamPanel } from "~/widgets/chat-panel";
import { type CycleView, showsGoalPrompt } from "../model/goalPrompt";
import { ConversationsSection } from "./ConversationsSection";

const cycleRoute = getRouteApi("/_shell/_authed/s/$slug/cycle");

const VIEWS: readonly { value: CycleView; label: string }[] = [
	{ value: "list", label: "List" },
	{ value: "board", label: "Board" },
];

/** The Startup's home: this week's goal, Cards and conversations, with the Board as a second view of the same Cards. */
export function StartupCyclePage() {
	const { card: cardId, view = "list" } = cycleRoute.useSearch();
	const navigate = cycleRoute.useNavigate();
	const { startup, isFounder } = useWorkspace();
	const isTeamUnread = useTeamThread(startup._id)?.unread ?? false;
	const cycle = useCycle(startup._id);
	const cards = useBoardCards(useBoardScope());

	function setCard(card: string | undefined) {
		void navigate({ search: (prev) => ({ ...prev, card }) });
	}

	const panel = useDetailPanel(cardId !== undefined, () => setCard(undefined), {
		opensOnRequest: true,
	});

	// Until both have loaded, a prompt could flash over a Board that has Cards.
	const asksForGoal =
		cycle !== undefined &&
		cards !== undefined &&
		showsGoalPrompt({
			isFounder,
			goal: cycle.goal,
			cardCount: cards.length,
			view,
		});

	return (
		<CardBoard cardId={cardId} onCardChange={setCard}>
			<AppPage
				width={view === "board" && !asksForGoal ? "full" : "column"}
				notice={<ReviewBanner />}
				bar={{
					title: <CycleHeader showsGoalInput={!asksForGoal} />,
					actions: (
						<>
							<Segmented
								label="View"
								options={VIEWS}
								value={view}
								onChange={(next) =>
									void navigate({
										search: (prev) => ({
											...prev,
											view: next === "list" ? undefined : next,
										}),
									})
								}
							/>
							<Button
								variant="ghost"
								size="sm"
								onClick={cardId ? panel.back : panel.toggle}
							>
								Threads
								{isTeamUnread ? <UnreadDot /> : null}
							</Button>
						</>
					),
				}}
				panel={
					<DetailPanel
						collapses
						shows={panel.shows}
						title={cardId ? "Card" : "Threads"}
						description={cardId ? "Edit this Card." : "Talk with your team."}
						onClose={panel.close}
						item={
							<OpenCardPanel
								backLabel="Threads"
								isBackUnread={isTeamUnread}
								onBack={panel.back}
								onClose={panel.close}
							/>
						}
						fallback={<TeamPanel onClose={panel.close} />}
					/>
				}
			>
				<h1 className="sr-only">Cycle</h1>
				{view === "board" ? (
					asksForGoal ? (
						<GoalPrompt />
					) : (
						<Board />
					)
				) : (
					<>
						<Section label="What you ship this week">
							{asksForGoal ? <GoalPrompt /> : null}
							<CycleCards />
						</Section>
						<ConversationsSection />
					</>
				)}
			</AppPage>
		</CardBoard>
	);
}
