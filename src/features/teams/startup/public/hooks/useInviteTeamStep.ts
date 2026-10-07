import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { inviteSchema } from "~/features/teams/team/schemas/invite";
import { toErrorMessage, validate } from "~/lib/validation";

export const INVITE_ROWS = 5;

/**
 * The wizard's last screen: up to five invites as Members. Rows that fail stay
 * filled so the Founder can fix them; the rest are cleared once sent.
 */
export function useInviteTeamStep(
	startupId: Id<"startups">,
	onDone: () => void,
) {
	const createInvite = useMutation(api.teams.invitations.create);
	const [rows, setRows] = useState<string[]>(() =>
		Array.from({ length: INVITE_ROWS }, () => ""),
	);
	const [isPending, setIsPending] = useState(false);
	const hasAny = rows.some((row) => row.trim().length > 0);

	function setRow(index: number, value: string) {
		setRows((current) =>
			current.map((row, rowIndex) => (rowIndex === index ? value : row)),
		);
	}

	async function sendInvites() {
		setIsPending(true);
		let sent = 0;
		const remaining = [...rows];
		for (const [index, row] of rows.entries()) {
			if (!row.trim()) continue;
			const parsed = validate(inviteSchema, { invitee: row, role: "member" });
			if (!parsed.ok) {
				toast.error(parsed.message);
				continue;
			}
			try {
				await createInvite({ startupId, ...parsed.data });
				remaining[index] = "";
				sent += 1;
			} catch (error) {
				toast.error(
					`${parsed.data.invitee}: ${toErrorMessage(error, "Could not invite")}`,
				);
			}
		}
		setRows(remaining);
		setIsPending(false);

		if (sent > 0) {
			toast.success(sent === 1 ? "Invite sent" : `${sent} invites sent`);
		}
		if (remaining.every((row) => !row.trim())) {
			onDone();
		}
	}

	return { rows, setRow, hasAny, isPending, sendInvites };
}
