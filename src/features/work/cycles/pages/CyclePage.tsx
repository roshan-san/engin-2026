import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { CloseCycleDialog } from "~/features/work/cycles/components/CloseCycleDialog";
import { CycleBoard } from "~/features/work/cycles/components/CycleBoard";
import { CycleMembers } from "~/features/work/cycles/components/CycleMembers";
import { cycleStatusLabel } from "~/features/work/cycles/constants";
import { useCycle } from "~/features/work/cycles/hooks/useCycle";
import { formatDateRange } from "~/lib/dates";

type CyclePageProps = {
	readonly slug: string;
	readonly cycleId: Id<"cycles">;
};

/** One Cycle: its lifecycle, its Members and its board. */
export function CyclePage({ slug, cycleId }: CyclePageProps) {
	const { view, pending, start, close, setMember } = useCycle(cycleId);

	const back = (
		<Link
			to="/s/$slug/cycles"
			params={{ slug }}
			className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft className="size-4" />
			Cycles
		</Link>
	);

	if (view === undefined) {
		return (
			<div className="mx-auto w-full max-w-6xl space-y-4">
				{back}
				<PageLoading rows={4} />
			</div>
		);
	}
	if (view === null) {
		return (
			<div className="mx-auto w-full max-w-3xl space-y-4">
				{back}
				<EmptyState
					title="You are not part of this Cycle"
					description="Ask a Founder to add you to it."
				/>
			</div>
		);
	}

	const { cycle, isFounder, members, plannedCycles } = view;
	const isClosed = cycle.status === "closed";

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6">
			<div className="space-y-3">
				{back}
				<header className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0 space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-xl font-semibold break-words">
								{cycle.title}
							</h1>
							<Badge
								variant={cycle.status === "active" ? "default" : "outline"}
							>
								{cycleStatusLabel(cycle.status)}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground">
							{formatDateRange(cycle.startAt, cycle.endAt)}
						</p>
					</div>
					{isFounder && cycle.status === "planned" ? (
						<Button
							size="sm"
							disabled={pending === "start"}
							onClick={() => void start()}
						>
							Start Cycle
						</Button>
					) : null}
					{isFounder && cycle.status === "active" ? (
						<CloseCycleDialog
							title={cycle.title}
							plannedCycles={plannedCycles}
							isPending={pending === "close"}
							onClose={close}
						/>
					) : null}
				</header>
				<CycleMembers
					startupId={cycle.startupId}
					members={members}
					canManage={isFounder && !isClosed}
					isPending={pending === "members"}
					onChange={(userId, isMember) => void setMember(userId, isMember)}
				/>
				{isClosed ? (
					<p className="text-sm text-muted-foreground">
						This Cycle is closed, so its board is read-only.
					</p>
				) : null}
			</div>

			<CycleBoard
				startupId={cycle.startupId}
				cycleId={cycle._id}
				isFounder={isFounder}
				isReadOnly={isClosed}
			/>
		</div>
	);
}
