import type { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import type { ApplicantRow } from "~/entities/application";
import { displayName } from "~/shared/lib/displayName";

type ThreadRow = FunctionReturnType<typeof api.threads.list>[number];
type QueueRow = FunctionReturnType<typeof api.cards.listReviewQueue>[number];

export type SidebarInput = {
	readonly participants: ApplicantRow[];
	readonly queue: Pick<QueueRow, "owner">[];
	readonly threads: Pick<
		ThreadRow,
		"_id" | "kind" | "participant" | "unread"
	>[];
};

export type SidebarParticipant = {
	readonly userId: Id<"users">;
	readonly applicationId: Id<"applications">;
	readonly name: string;
	readonly image: string | null;
	readonly username: string | null;
	readonly rating: number;
	readonly reviewCount: number;
	readonly shortlisted: boolean;
	readonly decision: "hired" | "not_this_time" | null;
	readonly unread: boolean;
	/** Their Cards, and how many are Done. */
	readonly progress: { readonly done: number; readonly total: number };
};

/** The space's left bar: Review's count, # Everyone's dot, and each Participant. */
export function sidebarItems(input: SidebarInput) {
	const reviewsOf = (userId: string) =>
		input.queue.filter((card) => card.owner?._id === userId).length;
	const privateThread = (userId: string) =>
		input.threads.find(
			(thread) =>
				thread.kind === "private" && thread.participant?._id === userId,
		);

	return {
		reviewCount: input.queue.length,
		everyoneUnread:
			input.threads.find((thread) => thread.kind === "everyone")?.unread ??
			false,
		participants: input.participants.map(
			({ application, user, progress }): SidebarParticipant => ({
				userId: user._id,
				applicationId: application._id,
				name: displayName(user),
				image: user.image,
				username: user.username,
				rating: user.rating,
				reviewCount: reviewsOf(user._id),
				shortlisted: application.shortlisted,
				decision: application.decision,
				unread: privateThread(user._id)?.unread ?? false,
				progress: progress ?? { done: 0, total: 0 },
			}),
		),
	};
}

/** The space's view from the URL, or a sensible one when it's unset or gone (a screening id after the start, a removed Participant). */
export function resolveView(
	view: string | undefined,
	participantIds: readonly string[],
	status: "draft" | "open" | "live" | "deciding" | "done",
): string {
	if (view === "review" || view === "everyone") return view;
	if (view && participantIds.includes(view)) return view;
	return status === "live" ? "review" : (participantIds[0] ?? "review");
}
