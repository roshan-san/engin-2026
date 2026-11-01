import { type Infer, v } from "convex/values";

const DAY_MS = 24 * 60 * 60 * 1000;

export const MAX_THREADS = 20;
/** How long after a Hackathon finishes its private threads stay open. */
export const PRIVATE_THREAD_GRACE_MS = 14 * DAY_MS;
export const threadKind = v.union(
	v.literal("team"),
	v.literal("everyone"),
	v.literal("private"),
);

/**
 * Whether a thread takes new messages. Team threads never lock, Everyone locks when
 * the Hackathon is done, and private threads stay open for the grace after that.
 */
export function isThreadOpen(
	kind: Infer<typeof threadKind>,
	hackathon: { readonly status: string; readonly finishedAt?: number },
	now: number,
): boolean {
	if (kind === "team" || hackathon.status !== "done") {
		return true;
	}
	return (
		kind === "private" &&
		hackathon.finishedAt !== undefined &&
		now < hackathon.finishedAt + PRIVATE_THREAD_GRACE_MS
	);
}
