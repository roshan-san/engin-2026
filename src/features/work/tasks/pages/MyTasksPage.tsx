import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { Button } from "~/components/ui/button";
import {
	MyTaskRow,
	ReviewRow,
} from "~/features/work/tasks/components/MyTaskRow";
import {
	type MyTask,
	useMyTasks,
} from "~/features/work/tasks/hooks/useMyTasks";

/** Where sign-in lands: the viewer's Tasks across every Startup and hackathon. */
export function MyTasksPage() {
	const { tasks, toReview, open, inReview, done } = useMyTasks();

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<h1 className="text-xl font-semibold">My Tasks</h1>
			{toReview && toReview.length > 0 ? (
				<section className="space-y-3">
					<h2 className="text-sm font-medium text-muted-foreground">
						Awaiting your review · {toReview.length}
					</h2>
					<ul className="space-y-2">
						{toReview.map((task) => (
							<ReviewRow key={task._id} task={task} />
						))}
					</ul>
				</section>
			) : null}
			{tasks === undefined ? (
				<PageLoading rows={3} />
			) : tasks.length === 0 ? (
				<EmptyState
					title="No Tasks yet"
					description="Tasks you take on a Cycle or work on in a hackathon show up here."
					action={
						<Button asChild size="sm">
							<Link to="/discover">Find a Hackathon</Link>
						</Button>
					}
				/>
			) : (
				<>
					<TaskGroup
						heading="Open"
						tasks={open}
						empty="Nothing open. Take a Task on a Cycle to get going."
					/>
					{inReview.length > 0 ? (
						<TaskGroup heading="In review" tasks={inReview} />
					) : null}
					{done.length > 0 ? <TaskGroup heading="Done" tasks={done} /> : null}
				</>
			)}
		</div>
	);
}

type TaskGroupProps = {
	readonly heading: string;
	readonly tasks: MyTask[];
	readonly empty?: string;
};

function TaskGroup({ heading, tasks, empty }: TaskGroupProps) {
	return (
		<section className="space-y-3">
			<h2 className="text-sm font-medium text-muted-foreground">
				{heading} · {tasks.length}
			</h2>
			{tasks.length === 0 ? (
				<p className="text-sm text-muted-foreground">{empty}</p>
			) : (
				<ul className="space-y-2">
					{tasks.map((task) => (
						<MyTaskRow key={task._id} task={task} />
					))}
				</ul>
			)}
		</section>
	);
}
