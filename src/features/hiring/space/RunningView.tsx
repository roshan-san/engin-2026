import type { Doc, Id } from "@convex/_generated/dataModel";
import { phaseOf } from "@convex/shared/hackathonPhase";
import { getRouteApi } from "@tanstack/react-router";
import { StarIcon } from "lucide-react";
import { useWorkspace } from "~/entities/startup";
import { cn } from "~/shared/lib/cn";
import { tierText } from "~/shared/lib/tierText";
import { EmptyState } from "~/shared/ui/EmptyState";
import { PersonAvatar } from "~/shared/ui/PersonAvatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/shared/ui/select";
import { UnreadDot } from "~/shared/ui/UnreadDot";
import { EveryonePanel } from "./EveryonePanel";
import { ParticipantView } from "./ParticipantView";
import { participantOptionLabel } from "./participantOptionLabel";
import { ReviewQueue } from "./ReviewQueue";
import {
	resolveView,
	type SidebarParticipant,
	sidebarItems,
} from "./sidebarItems";
import { useApplicants } from "./useApplicants";
import { useHackathonThreads } from "./useHackathonThreads";
import { useReviewQueue } from "./useReviewQueue";

const route = getRouteApi("/_shell/_authed/s/$slug/hiring/$id");

const ITEM_CLASS =
	"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent aria-[current=true]:bg-accent focus-ring";

/** Live, deciding and done: Review, # Everyone, and each Participant. */
export function RunningView({
	hackathon,
}: {
	readonly hackathon: Doc<"hackathons">;
}) {
	const { userId } = useWorkspace();
	const applicants = useApplicants(hackathon._id);
	const { queue } = useReviewQueue(hackathon._id);
	const threads = useHackathonThreads(hackathon._id);
	const view = route.useSearch({ select: (search) => search.view });
	const navigate = route.useNavigate();
	const phase = phaseOf(hackathon, Date.now());
	const isClosed = phase === "done";

	const participants =
		applicants?.filter((row) => row.application.status === "participating") ??
		[];
	const items = sidebarItems({
		participants,
		queue: queue ?? [],
		threads: threads ?? [],
	});
	const current = resolveView(
		view,
		participants.map((row) => row.user._id),
		phase,
	);
	const participantRow = participants.find((row) => row.user._id === current);
	const privateThread = threads?.find(
		(thread) =>
			thread.kind === "private" && thread.participant?._id === current,
	);

	function show(next: string, cardId?: Id<"cards">) {
		void navigate({ search: { view: next, card: cardId } });
	}

	const choices = [
		{ value: "review", label: `Review · ${items.reviewCount}` },
		{ value: "everyone", label: "# Everyone" },
		...items.participants.map((participant) => ({
			value: participant.userId,
			label: participantOptionLabel(participant),
		})),
	];

	// Only a Hackathon that finished with nobody accepted gets here empty: removing a
	// Participant is a Screening-only action, and goLive ends it at the start otherwise.
	if (applicants !== undefined && participants.length === 0 && isClosed) {
		return (
			<EmptyState title="Nobody was accepted, so this Hackathon ended when it was due to start." />
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col md:flex-row">
			<nav
				aria-label="Hackathon"
				className="hidden w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border p-2 md:flex"
			>
				<div className="flex flex-col gap-0.5">
					<button
						type="button"
						aria-current={current === "review"}
						className={ITEM_CLASS}
						onClick={() => show("review")}
					>
						Review
						<span className="ml-auto text-xs tabular-nums text-muted-foreground">
							{items.reviewCount}
						</span>
					</button>
					<button
						type="button"
						aria-current={current === "everyone"}
						className={ITEM_CLASS}
						onClick={() => show("everyone")}
					>
						# Everyone
						{items.everyoneUnread ? (
							<span className="ml-auto flex">
								<UnreadDot />
							</span>
						) : null}
					</button>
				</div>
				<div className="flex flex-col gap-1">
					<h2 className="mx-2 border-b border-border pb-2 text-xs font-semibold text-muted-foreground">
						Participants
					</h2>
					<ul className="flex flex-col gap-0.5">
						{items.participants.map((participant) => (
							<li key={participant.userId}>
								<button
									type="button"
									aria-current={current === participant.userId}
									className={cn(ITEM_CLASS, "items-start py-2")}
									onClick={() => show(participant.userId)}
								>
									<PersonAvatar
										person={participant}
										size={20}
										className="mt-0.5"
									/>
									<span className="flex min-w-0 flex-1 flex-col gap-1">
										<span className="flex items-center gap-1.5">
											<span
												className={cn(
													"min-w-0 flex-1 truncate",
													tierText(participant.rating),
												)}
											>
												{participant.name}
											</span>
											{participant.shortlisted ? (
												<StarIcon
													aria-label="Shortlisted"
													className="size-3.5 shrink-0 fill-current text-warning"
												/>
											) : null}
											{participant.unread ? <UnreadDot /> : null}
											{participant.reviewCount > 0 ? (
												<span
													title={`${participant.reviewCount} to review`}
													className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums text-foreground"
												>
													{participant.reviewCount}
												</span>
											) : null}
										</span>
										<ParticipantProgress participant={participant} />
									</span>
								</button>
							</li>
						))}
					</ul>
				</div>
			</nav>

			<div className="border-b border-border p-2 md:hidden">
				<Select value={current} onValueChange={(next) => show(next)}>
					<SelectTrigger aria-label="Show" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{choices.map((choice) => (
							<SelectItem key={choice.value} value={choice.value}>
								{choice.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<main className="flex min-h-0 min-w-0 flex-1 flex-col">
				{current === "review" ? (
					<ReviewQueue
						hackathonId={hackathon._id}
						founder={{ userId, role: "founder", phase }}
						onOpen={(participantId, cardId) => show(participantId, cardId)}
					/>
				) : current === "everyone" ? (
					<div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
						<EveryonePanel
							hackathonId={hackathon._id}
							userId={userId}
							isReadOnly={isClosed}
						/>
					</div>
				) : participantRow ? (
					<ParticipantView
						key={participantRow.user._id}
						hackathon={hackathon}
						row={participantRow}
						threadId={privateThread?._id}
						isThreadUnread={privateThread?.unread ?? false}
						userId={userId}
					/>
				) : null}
			</main>
		</div>
	);
}

/** "2/4 done" with a thin bar, or the decision once it's made. */
function ParticipantProgress({
	participant,
}: {
	readonly participant: SidebarParticipant;
}) {
	const { done, total } = participant.progress;
	if (participant.decision) {
		return (
			<span className="text-xs text-muted-foreground">
				{participant.decision === "hired" ? "Hired" : "Not this time"}
			</span>
		);
	}
	return (
		<span className="flex items-center gap-2">
			<span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
				<span
					className="block h-full rounded-full bg-success"
					style={{ width: total > 0 ? `${(done / total) * 100}%` : 0 }}
				/>
			</span>
			<span className="text-xs text-muted-foreground tabular-nums">
				{done}/{total}
			</span>
		</span>
	);
}
