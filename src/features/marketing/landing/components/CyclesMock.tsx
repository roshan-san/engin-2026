import { Row, RowList } from "~/components/shared/RowList";
import { StatusDot } from "~/components/shared/StatusDot";
import type { TaskStatus } from "~/features/work/tasks/constants";

const TASKS: readonly {
	readonly title: string;
	readonly meta: string;
	readonly status: TaskStatus;
	readonly label: string;
}[] = [
	{
		title: "Ship the invite flow",
		meta: "Proof: pull request",
		status: "review",
		label: "Review",
	},
	{
		title: "Fix checkout redirect",
		meta: "Priya N.",
		status: "in_progress",
		label: "In progress",
	},
	{
		title: "Write onboarding emails",
		meta: "Unassigned",
		status: "todo",
		label: "To do",
	},
	{
		title: "Launch the pricing page",
		meta: "Verified by a Founder",
		status: "done",
		label: "Done",
	},
];

/** A static Cycle: Tasks as rows, one dot colour per status. */
export function CyclesMock() {
	return (
		<div className="px-2">
			<RowList>
				{TASKS.map((task) => (
					<Row
						key={task.title}
						leading={<StatusDot status={task.status} />}
						title={task.title}
						meta={task.meta}
						trailing={task.label}
					/>
				))}
			</RowList>
		</div>
	);
}
