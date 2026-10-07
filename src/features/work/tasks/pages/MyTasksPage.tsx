import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { PageHeader } from "~/components/shared/PageHeader";
import { RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Button } from "~/components/ui/button";
import {
	MyTaskRow,
	ReviewRow,
} from "~/features/work/tasks/components/MyTaskRow";
import { TASK_STATUSES } from "~/features/work/tasks/constants";
import { useMyTasks } from "~/features/work/tasks/hooks/useMyTasks";

/** Where sign-in lands: the viewer's Tasks across every Startup and hackathon. */
export function MyTasksPage() {
	const { tasks, toReview, byStatus } = useMyTasks();

	return (
		<div className="mx-auto w-full max-w-5xl space-y-8">
			<PageHeader hidden title="My Tasks" />
			{toReview && toReview.length > 0 ? (
				<section className="space-y-2">
					<SectionLabel>Awaiting your review · {toReview.length}</SectionLabel>
					<RowList>
						{toReview.map((task) => (
							<ReviewRow key={task._id} task={task} />
						))}
					</RowList>
				</section>
			) : null}
			{tasks === undefined ? (
				<PageLoading rows={3} />
			) : tasks.length === 0 ? (
				<EmptyState
					title="No Tasks yet"
					body="Tasks you take on a Cycle or work on in a hackathon show up here."
					action={
						<Button asChild size="sm">
							<Link to="/explore/hackathons">Find a Hackathon</Link>
						</Button>
					}
				/>
			) : (
				TASK_STATUSES.map(({ value, label }) => {
					const group = byStatus(value);
					return group.length > 0 ? (
						<section key={value} className="space-y-2">
							<SectionLabel>
								{label} · {group.length}
							</SectionLabel>
							<RowList>
								{group.map((task) => (
									<MyTaskRow key={task._id} task={task} />
								))}
							</RowList>
						</section>
					) : null;
				})
			)}
		</div>
	);
}
