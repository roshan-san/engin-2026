import type { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { displayName } from "~/features/work/cards/displayName";
import type { ApplicantRow } from "./applicantSort";

type ThreadRow = FunctionReturnType<typeof api.chat.threads.list>[number];
type QueueRow = FunctionReturnType<
	typeof api.work.cards.listReviewQueue
>[number];

export type SidebarInput = {
	readonly builders: ApplicantRow[];
	readonly queue: Pick<QueueRow, "owner">[];
	readonly threads: Pick<ThreadRow, "_id" | "kind" | "builder" | "unread">[];
};

export type SidebarBuilder = {
	readonly userId: Id<"users">;
	readonly applicationId: Id<"applications">;
	readonly name: string;
	readonly image: string | null;
	readonly username: string | null;
	readonly reviewCount: number;
	readonly shortlisted: boolean;
	readonly unread: boolean;
};

/** The space's left bar: Review's count, # Everyone's dot, and each Builder. */
export function sidebarItems(input: SidebarInput) {
	const reviewsOf = (userId: string) =>
		input.queue.filter((card) => card.owner?._id === userId).length;
	const privateThread = (userId: string) =>
		input.threads.find(
			(thread) => thread.kind === "private" && thread.builder?._id === userId,
		);

	return {
		reviewCount: input.queue.length,
		everyoneUnread:
			input.threads.find((thread) => thread.kind === "everyone")?.unread ??
			false,
		builders: input.builders.map(
			({ application, user }): SidebarBuilder => ({
				userId: user._id,
				applicationId: application._id,
				name: displayName(user),
				image: user.image,
				username: user.username,
				reviewCount: reviewsOf(user._id),
				shortlisted: application.shortlisted,
				unread: privateThread(user._id)?.unread ?? false,
			}),
		),
	};
}
