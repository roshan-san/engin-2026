import type { Id } from "@convex/_generated/dataModel";
import { Navigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageLoading } from "~/components/globals/PageLoading";
import { Badge } from "~/components/ui/badge";
import { CloseHackathonForm } from "~/features/hiring/hackathons/components/CloseHackathonForm";
import { HackathonAnnouncements } from "~/features/hiring/hackathons/components/HackathonAnnouncements";
import {
	applicantName,
	HackathonApplicants,
	hasLane,
} from "~/features/hiring/hackathons/components/HackathonApplicants";
import { HackathonHeader } from "~/features/hiring/hackathons/components/HackathonHeader";
import { HackathonStarterTasks } from "~/features/hiring/hackathons/components/HackathonStarterTasks";
import { MyVerdict } from "~/features/hiring/hackathons/components/MyVerdict";
import { ParticipantHackathonActions } from "~/features/hiring/hackathons/components/ParticipantHackathonActions";
import { useHackathon } from "~/features/hiring/hackathons/hooks/useHackathon";
import { applicationStatusLabel } from "~/features/hiring/myHackathons/constants";
import {
	CycleBoard,
	type LaneOption,
} from "~/features/work/cycles/components/CycleBoard";
import {
	type ReviewScope,
	useReviewQueue,
} from "~/features/work/cycles/hooks/useLaneTasks";

type HackathonPageProps = {
	readonly slug: string;
	readonly hackathonId: string;
};

/**
 * The Hackathon screen is exempt from the blanket member gate — access is
 * decided by the existing api.hiring.hackathons.get rule, which lets
 * Participants and Applicants who are not Members through.
 */
export function HackathonPage({ slug, hackathonId }: HackathonPageProps) {
	const { hackathon } = useHackathon(hackathonId);
	const [isClosing, setIsClosing] = useState(false);
	const [pickedLane, setPickedLane] = useState<Id<"users"> | null>(null);
	const [scope, setScope] = useState<ReviewScope>("all");
	const boardRef = useRef<HTMLDivElement>(null);
	const hasStarted =
		hackathon?.status === "active" || hackathon?.status === "closed";
	const { review, countByLane } = useReviewQueue(
		hackathon?.isFounder && hasStarted ? hackathon.cycleId : null,
	);

	if (hackathon === undefined) {
		return <PageLoading rows={3} />;
	}

	if (
		hackathon === null ||
		hackathon.startupSlug !== slug ||
		(!hackathon.isMember && hackathon.myStatus === null)
	) {
		return <Navigate to="/startup/$slug" params={{ slug }} replace />;
	}

	const isLive =
		hackathon.status === "draft" ||
		hackathon.status === "open" ||
		hackathon.status === "active";
	const isPublishedLive =
		hackathon.status === "open" || hackathon.status === "active";
	const hasOwnLane =
		hackathon.myStatus === "accepted" || hackathon.myStatus === "completed";
	const showsCloseForm =
		isClosing && hackathon.isFounder && hackathon.status === "active";

	const lanes: LaneOption[] = hackathon.applicants
		.filter((applicant) => hasLane(applicant.status))
		.map((applicant) => ({
			userId: applicant.userId,
			name: applicantName(applicant),
			hasLeft: applicant.status === "left",
		}));
	const busiestLane = [...lanes].sort(
		(a, b) =>
			(countByLane.get(b.userId) ?? 0) - (countByLane.get(a.userId) ?? 0),
	)[0];
	const shownLane = hackathon.isFounder
		? (pickedLane ?? busiestLane?.userId ?? null)
		: null;

	function showBoard() {
		boardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function openLane(userId: Id<"users">) {
		setPickedLane(userId);
		setScope("lane");
		showBoard();
	}

	const showsFounderBoard = hackathon.isFounder && hasStarted;
	const showsOwnBoard =
		!hackathon.isFounder && hasOwnLane && hackathon.status !== "draft";
	const board =
		showsFounderBoard || showsOwnBoard ? (
			<div ref={boardRef} className="scroll-mt-4 space-y-3">
				<h2 className="text-lg font-semibold">
					{hackathon.isFounder ? "Board" : "Your lane"}
				</h2>
				<CycleBoard
					startupId={hackathon.startupId}
					cycleId={hackathon.cycleId}
					isFounder={hackathon.isFounder}
					isReadOnly={
						hackathon.status !== "active" ||
						(!hackathon.isFounder && hackathon.myStatus !== "accepted")
					}
					lane={{
						mode: "hackathon",
						assigneeUserId: shownLane,
						canPickLane: hackathon.isFounder,
						lanes,
						onLaneChange: setPickedLane,
						scope,
						onScopeChange: setScope,
						hasStarted,
					}}
				/>
			</div>
		) : null;

	return (
		<div className="mx-auto w-full max-w-6xl space-y-8">
			<div className="max-w-3xl">
				<HackathonHeader
					hackathon={hackathon}
					onClose={showsCloseForm ? undefined : () => setIsClosing(true)}
					reviewCount={review?.tasks.length ?? 0}
					onShowReview={() => {
						setScope("all");
						showBoard();
					}}
				/>
			</div>
			{hackathon.status === "closed" &&
			hackathon.myVerdict &&
			hackathon.myApplicationId ? (
				<div className="max-w-3xl">
					<MyVerdict
						applicationId={hackathon.myApplicationId}
						verdict={hackathon.myVerdict}
						evaluation={hackathon.myEvaluation}
						isEvaluationPublic={hackathon.myEvaluationPublic}
						offer={hackathon.myOffer}
						startupName={hackathon.startupName}
						startupSlug={hackathon.startupSlug}
						roleTitle={hackathon.roleTitle}
					/>
				</div>
			) : null}
			{hasStarted ? board : null}
			<div className="max-w-3xl space-y-8">
				{showsCloseForm ? (
					<CloseHackathonForm
						hackathonId={hackathon._id}
						hackathonTitle={hackathon.title}
						participants={hackathon.applicants
							.filter((applicant) => applicant.status === "accepted")
							.map((applicant) => ({
								applicationId: applicant._id,
								userId: applicant.userId,
								name: applicantName(applicant),
							}))}
						canOffer={hackathon.roleIsOpen}
						onDone={() => setIsClosing(false)}
						onOpenLane={openLane}
					/>
				) : hackathon.isMember ? (
					<>
						<HackathonApplicants
							applicants={hackathon.applicants}
							hackathonStatus={hackathon.status}
							isFounder={hackathon.isFounder}
							onOpenLane={openLane}
						/>
						<HackathonStarterTasks
							hackathonId={hackathon._id}
							status={hackathon.status}
							canEdit={hackathon.isFounder && isLive}
						/>
						{hackathon.status !== "draft" ? (
							<HackathonAnnouncements
								hackathonId={hackathon._id}
								canPost={hackathon.isFounder && isPublishedLive}
							/>
						) : null}
					</>
				) : hackathon.myStatus ? (
					<>
						<section className="space-y-2">
							<h2 className="text-lg font-semibold">Your status</h2>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="outline">
									{applicationStatusLabel(hackathon.myStatus, hackathon.status)}
								</Badge>
								<ParticipantHackathonActions
									hackathonId={hackathon._id}
									hackathonTitle={hackathon.title}
									hackathonStatus={hackathon.status}
									myStatus={hackathon.myStatus}
								/>
							</div>
						</section>
						{hasOwnLane ? (
							<HackathonAnnouncements
								hackathonId={hackathon._id}
								canPost={false}
							/>
						) : null}
					</>
				) : null}
			</div>
			{hasStarted ? null : board}
		</div>
	);
}
