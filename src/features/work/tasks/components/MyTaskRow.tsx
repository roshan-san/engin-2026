import { Link } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import type {
	MyTask,
	TaskToReview,
} from "~/features/work/tasks/hooks/useMyTasks";
import { TASK_STATUSES } from "~/features/work/tasks/constants";

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

function statusLabel(status: MyTask["status"]): string {
	return TASK_STATUSES.find((item) => item.value === status)?.label ?? status;
}

/** One of the viewer's Tasks, linking to the Cycle or Hackathon it lives on. */
export function MyTaskRow({ task }: { readonly task: MyTask }) {
	const { place } = task;
	const where = `${task.startupName} · ${place.title}`;
	const proofCount = task.proofLinks.length;

	return (
		<li>
			<Link
				{...placeLink(task.startupSlug, place)}
				className="block space-y-1 rounded-lg border p-4 hover:bg-muted/30"
			>
				<div className="flex items-start justify-between gap-3">
					<p className="min-w-0 font-medium break-words">{task.title}</p>
					<Badge variant="outline" className="shrink-0">
						{statusLabel(task.status)}
					</Badge>
				</div>
				<p className="text-sm break-words text-muted-foreground">
					{where}
					{place.kind === "hackathon" ? " (hackathon)" : null}
					{proofCount > 0
						? ` · ${proofCount} proof ${proofCount === 1 ? "link" : "links"}`
						: null}
				</p>
				{task.reviewNote &&
				(task.status === "todo" || task.status === "in_progress") ? (
					<p className="text-sm break-words text-destructive">
						Changes requested: {task.reviewNote}
					</p>
				) : null}
			</Link>
		</li>
	);
}

/** A Task awaiting the viewer's review, linking to its Cycle or Hackathon screen. */
export function ReviewRow({ task }: { readonly task: TaskToReview }) {
	const { place } = task;
	const assignee =
		task.assignee?.name ?? task.assignee?.username ?? "Unassigned";
	return (
		<li>
			<Link
				{...placeLink(task.startupSlug, place)}
				className="block space-y-1 rounded-lg border p-4 hover:bg-muted/30"
			>
				<p className="font-medium break-words">{task.title}</p>
				<p className="text-sm break-words text-muted-foreground">
					{assignee} · {task.startupName} · {place.title}
					{place.kind === "hackathon" ? " (hackathon)" : null}
				</p>
			</Link>
		</li>
	);
}
