import type { MyInvite } from "../api/useMyInvites";

/** How an Invite is named: a hire from a Hackathon, or a plain invite. */
export function inviteTitle(invite: MyInvite): string {
	return invite.fromHackathon
		? `Hired at ${invite.startupName}`
		: `${invite.startupName} invited you`;
}
