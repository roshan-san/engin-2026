import type { MyInvite } from "../api/useMyInvites";

/** How an Invite is named: an Offer from a Hackathon, or a plain invite. */
export function inviteTitle(invite: MyInvite): string {
	return invite.fromHackathon
		? `Offer from ${invite.startupName}`
		: `${invite.startupName} invited you`;
}
