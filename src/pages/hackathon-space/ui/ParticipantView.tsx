import type { Doc, Id } from "@convex/_generated/dataModel";
import { phaseOf } from "@convex/hackathons/rules";
import { getRouteApi } from "@tanstack/react-router";
import { StarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { ApplicantRow } from "~/entities/application";
import { type BoardScope, BoardScopeContext } from "~/entities/card";
import {
	DecideSheet,
	decideState,
	useDecide,
} from "~/features/decide-participant";
import { tierText } from "~/shared/lib/tierText";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import { DetailPanel } from "~/shared/ui/DetailPanel";
import { PanelHeader } from "~/shared/ui/PanelHeader";
import { PersonAvatar } from "~/shared/ui/PersonAvatar";
import { PersonName } from "~/shared/ui/PersonName";
import { Segmented } from "~/shared/ui/Segmented";
import { UnreadDot } from "~/shared/ui/UnreadDot";
import { useDetailPanel } from "~/shared/ui/useDetailPanel";
import { Board, CardBoard, OpenCardPanel } from "~/widgets/card-board";
import { ThreadPanel } from "~/widgets/chat-panel";

const route = getRouteApi("/_shell/_authed/s/$slug/hiring/$id");

const PANES = [
	{ value: "thread", label: "Thread" },
	{ value: "decide", label: "Decide" },
] as const;

/** One Participant: their Board, your private thread with them, and the decision. */
export function ParticipantView({
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
	// Once it's over, deciding is the job; until then, talking is.
	const [pane, setPane] = useState<"thread" | "decide">(
		phaseOf(hackathon, Date.now()) === "deciding" ? "decide" : "thread",
	);
	const cardId = route.useSearch({ select: (search) => search.card });
	const navigate = route.useNavigate();
	const participantId = row.user._id;
	const phase = phaseOf(hackathon, Date.now());
	// Deciding is the job now, so Decide leads on a phone until they're decided.
	const isDeciding = phase === "deciding" && !row.application.decision;

	const scope = useMemo<BoardScope>(
		() => ({
			kind: "participant",
			hackathonId: hackathon._id,
			participantId,
			userId,
			role: "founder",
			phase,
		}),
		[hackathon._id, participantId, userId, phase],
	);

	function setCard(card: string | undefined) {
		void navigate({ search: (prev) => ({ ...prev, card }) });
	}

	const detail = useDetailPanel(cardId !== undefined, () => setCard(undefined));
	const onClose = detail.isMobile ? detail.close : undefined;

	const name = row.user.name ?? row.user.username ?? "them";
	const switcher = (
		<Segmented label="Show" options={PANES} value={pane} onChange={setPane} />
	);

	const card = (
		<OpenCardPanel
			backLabel={pane === "decide" ? "Decide" : "Thread"}
			isBackUnread={pane === "thread" && isThreadUnread}
			onBack={detail.back}
			onClose={onClose}
		/>
	);
	const own =
		pane === "thread" ? (
			<ThreadPanel
				threadId={threadId}
				title={switcher}
				userId={userId}
				placeholder={`Message ${name}`}
				emptyNote="Only you two see this."
				isReadOnly={phase === "done"}
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
			<CardBoard cardId={cardId} onCardChange={setCard}>
				<div className="flex min-h-0 min-w-0 flex-1">
					<div className="flex min-h-0 min-w-0 flex-1 flex-col">
						<PanelHeader className="gap-3 md:px-6">
							<ParticipantHeader row={row} hackathon={hackathon} />
							<Button
								variant={isDeciding ? "default" : "ghost"}
								size="sm"
								className="ml-auto md:hidden"
								onClick={() => {
									if (isDeciding) setPane("decide");
									detail.open();
								}}
							>
								{isDeciding ? "Decide" : "Thread and Decide"}
								{isThreadUnread ? <UnreadDot /> : null}
							</Button>
						</PanelHeader>
						<Board />
					</div>
					<DetailPanel
						shows={detail.shows}
						title={row.user.name ?? "Participant"}
						description="Thread, Decide and Cards."
						onClose={detail.close}
						item={card}
						fallback={own}
					/>
				</div>
			</CardBoard>
		</BoardScopeContext.Provider>
	);
}

/** Who this Board belongs to: their Rating, how far they've got, and ★. */
function ParticipantHeader({
	row,
	hackathon,
}: {
	readonly row: ApplicantRow;
	readonly hackathon: Doc<"hackathons">;
}) {
	const { application, user, progress } = row;
	const { shortlist } = useDecide(application._id);
	const { canShortlist } = decideState(application, hackathon, Date.now());

	return (
		<div className="flex min-w-0 items-center gap-3">
			<PersonAvatar person={user} size={24} />
			<h2 className="truncate text-sm font-medium">
				<PersonName person={user} />
			</h2>
			<span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:inline">
				Rating <span className={tierText(user.rating)}>{user.rating}</span>
				{progress ? ` · ${progress.done} of ${progress.total} done` : null}
			</span>
			{application.decision ? (
				<Badge variant="outline" className="text-muted-foreground">
					{application.decision === "hired" ? "Hired" : "Not this time"}
				</Badge>
			) : (
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={application.shortlisted ? "Shortlisted" : "Shortlist"}
					aria-pressed={application.shortlisted}
					title={application.shortlisted ? "Shortlisted" : "Shortlist"}
					disabled={!canShortlist}
					onClick={() => void shortlist(!application.shortlisted)}
				>
					<StarIcon
						className={
							application.shortlisted
								? "fill-current text-warning"
								: "text-muted-foreground"
						}
					/>
				</Button>
			)}
		</div>
	);
}
