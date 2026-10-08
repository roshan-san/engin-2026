import type { TaskStatus } from "~/features/work/tasks/constants";
import { cn } from "~/lib/utils";

const DOT_COLOR: Record<TaskStatus, string> = {
	todo: "bg-muted-foreground",
	in_progress: "bg-warning",
	review: "bg-link",
	done: "bg-success",
};

/** One colour per Task status. Decorative: pair it with a text label. */
export function StatusDot({ status }: { readonly status: TaskStatus }) {
	return (
		<span
			aria-hidden
			className={cn(
				"inline-block size-2 shrink-0 rounded-full",
				DOT_COLOR[status],
			)}
		/>
	);
}
