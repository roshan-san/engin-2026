import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";
import { useParticipant } from "~/entities/application";
import { useHackathonThreads } from "~/entities/message";
import { DecisionBanner } from "~/features/keep-promise";
import { roleLabel } from "~/shared/config/jobs";
import { AppPage } from "~/shared/ui/AppPage";
import { Button } from "~/shared/ui/button";
import { DetailPanel } from "~/shared/ui/DetailPanel";
import { Segmented } from "~/shared/ui/Segmented";
import { UnreadDot } from "~/shared/ui/UnreadDot";
import { useDetailPanel } from "~/shared/ui/useDetailPanel";
import { Board, CardBoard, OpenCardPanel } from "~/widgets/card-board";
import { ThreadPanel } from "~/widgets/chat-panel";

const route = getRouteApi("/_shell/_authed/h/$id/");

/** A Participant's own Board on a Hackathon, beside Everyone and the Founder. */
export function ParticipantBoardPage() {
	const { page, userId, status } = useParticipant();
	const { card: cardId, panel = "everyone" } = route.useSearch();
	const navigate = route.useNavigate();
	const threads = useHackathonThreads(page._id);
	const everyone = threads?.find((t) => t.kind === "everyone");
	const founder = threads?.find((t) => t.kind === "private");
	const current = panel === "founder" ? founder : everyone;
	const isAnyUnread = (everyone?.unread ?? false) || (founder?.unread ?? false);

	function setCard(card: string | undefined) {
		void navigate({ search: (prev) => ({ ...prev, card }) });
	}

	const detail = useDetailPanel(cardId !== undefined, () => setCard(undefined));
	const onClose = detail.isMobile ? detail.close : undefined;

	const switcher = (
		<Segmented
			label="Panel"
			options={[
				{
					value: "everyone",
					label: (
						<>
							Everyone
							{everyone?.unread && panel !== "everyone" ? <UnreadDot /> : null}
						</>
					),
				},
				{
					value: "founder",
					label: (
						<>
							Founder
							{founder?.unread && panel !== "founder" ? <UnreadDot /> : null}
						</>
					),
				},
			]}
			value={panel}
			onChange={(next) =>
				void navigate({ search: (prev) => ({ ...prev, panel: next }) })
			}
		/>
	);

	const card = (
		<OpenCardPanel
			backLabel="Threads"
			isBackUnread={isAnyUnread}
			onBack={detail.back}
			onClose={onClose}
		/>
	);
	const own = (
		<ThreadPanel
			key={panel}
			threadId={current?._id}
			title={switcher}
			userId={userId}
			placeholder={panel === "founder" ? "Message the Founder" : "Ask Everyone"}
			emptyNote={
				panel === "founder"
					? "Only you and the Founder see this."
					: "Ask here. Everyone sees it."
			}
			isReadOnly={page.status === "done"}
			onClose={onClose}
		/>
	);

	return (
		<CardBoard cardId={cardId} onCardChange={setCard}>
			<AppPage
				width="full"
				bar={{
					title: (
						<h1 className="flex min-w-0 items-baseline gap-1.5 truncate text-sm">
							<span className="font-medium">{roleLabel(page.job.role)}</span>
							<span aria-hidden className="text-muted-foreground">
								·
							</span>
							<Link
								to="/hackathons/$id"
								params={{ id: page._id }}
								className="flex min-w-0 items-center gap-0.5 truncate text-muted-foreground hover:text-foreground focus-ring"
							>
								<span className="truncate">{page.startup.name}</span>
								<ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0" />
							</Link>
						</h1>
					),
					actions: (
						<Button
							variant="ghost"
							size="sm"
							className="md:hidden"
							onClick={detail.open}
						>
							Threads
							{isAnyUnread ? <UnreadDot /> : null}
						</Button>
					),
				}}
				notice={
					page.myApplication?.decision ? (
						<DecisionBanner
							startupName={page.startup.name}
							application={{
								...page.myApplication,
								decision: page.myApplication.decision,
							}}
						/>
					) : status.note ? (
						<p className="border-b border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground md:px-6">
							{status.note}
						</p>
					) : null
				}
				panel={
					<DetailPanel
						shows={detail.shows}
						title={cardId ? "Card" : "Threads"}
						description="Talk with the Founder."
						onClose={detail.close}
						item={card}
						fallback={own}
					/>
				}
			>
				<Board />
			</AppPage>
		</CardBoard>
	);
}
