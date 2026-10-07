import { Row } from "~/components/shared/RowList";
import { StatusDot } from "~/components/shared/StatusDot";
import type {
	MyTask,
	TaskToReview,
} from "~/features/work/tasks/hooks/useMyTasks";

/** A team Task opens its Cycle; a hackathon Task opens the Hackathon screen. */
function placeLink(slug: string, place: MyTask["place"]) {
	return place.kind === "cycle"
		? ({
				to: "/s/$slug/cycles/$cycleId",
				params: { slug, cycleId: place.cycleId },
			} as const)
		: ({
				to: "/s/$slug/hackathons/$hackathonId",
				params: { slug, hackathonId: place.hackathonId },
			} as const);
}

/** One of the viewer's Tasks, linking to the Cycle or Hackathon it lives on. */
export function MyTaskRow({ task }: { readonly task: MyTask }) {
	const { place } = task;
	const where = `${task.startupName} · ${place.title}`;
	const proofCount = task.proofLinks.length;
	const showsNote =
		task.reviewNote &&
		(task.status === "todo" || task.status === "in_progress");

	return (
		<Row
			{...placeLink(task.startupSlug, place)}
			leading={<StatusDot status={task.status} />}
			title={task.title}
			meta={
				<>
					<span className="block truncate">
						{where}
						{place.kind === "hackathon" ? " (hackathon)" : null}
						{proofCount > 0
							? ` · ${proofCount} proof ${proofCount === 1 ? "link" : "links"}`
							: null}
					</span>
					{showsNote ? (
						<span className="block truncate text-destructive">
							Changes requested: {task.reviewNote}
						</span>
					) : null}
				</>
			}
		/>
	);
}

/** A Task awaiting the viewer's review, linking to its Cycle or Hackathon screen. */
export function ReviewRow({ task }: { readonly task: TaskToReview }) {
	const { place } = task;
	const assignee =
		task.assignee?.name ?? task.assignee?.username ?? "Unassigned";
	return (
		<Row
			{...placeLink(task.startupSlug, place)}
			leading={<StatusDot status="review" />}
			title={task.title}
			meta={`${assignee} · ${task.startupName} · ${place.title}${place.kind === "hackathon" ? " (hackathon)" : ""}`}
		/>
	);
}
