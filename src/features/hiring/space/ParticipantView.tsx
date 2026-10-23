import type { Doc, Id } from "@convex/_generated/dataModel";
import { phaseOf } from "@convex/shared/hackathonPhase";
import { getRouteApi } from "@tanstack/react-router";
import { StarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { DetailPanel } from "~/components/DetailPanel";
import { PanelHeader } from "~/components/PanelHeader";
import { Segmented } from "~/components/Segmented";
import { UnreadDot } from "~/components/UnreadDot";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useDetailPanel } from "~/components/useDetailPanel";
import { ThreadPanel } from "~/features/chat";
import { PersonAvatar, PersonName } from "~/features/people";
import {
	Board,
	type BoardScope,
	BoardScopeContext,
	CardPanel,
	type CardView,
	ShipDialog,
	tierText,
} from "~/features/work";
import type { ApplicantRow } from "./applicantSort";
import { DecideSheet } from "./DecideSheet";
import { decideState } from "./decideSteps";
import { useDecide } from "./useDecide";

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
	const [shipping, setShipping] = useState<CardView | null>(null);
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

	function closeCard() {
		void navigate({ search: (prev) => ({ ...prev, card: undefined }) });
	}

	const detail = useDetailPanel(cardId !== undefined, closeCard);
	const onClose = detail.isMobile ? detail.close : undefined;

	const name = row.user.name ?? row.user.username ?? "them";
	const switcher = (
		<Segmented label="Show" options={PANES} value={pane} onChange={setPane} />
	);

	const card = cardId ? (
		<CardPanel
			key={cardId}
			cardId={cardId}
			backLabel={pane === "decide" ? "Decide" : "Thread"}
			isBackUnread={pane === "thread" && isThreadUnread}
			onBack={detail.back}
			onClose={onClose}
			onShip={setShipping}
		/>
	) : null;
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
					<Board
						openCardId={cardId}
						onShip={setShipping}
						onOpen={(id) =>
							void navigate({ search: (prev) => ({ ...prev, card: id }) })
						}
						onClose={closeCard}
					/>
				</div>
				<DetailPanel
					shows={detail.shows}
					title={row.user.name ?? "Participant"}
					description="Thread, Decide and Cards."
					onClose={detail.close}
					item={card}
					fallback={own}
				/>
				{shipping ? (
					<ShipDialog card={shipping} onClose={() => setShipping(null)} />
				) : null}
			</div>
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
