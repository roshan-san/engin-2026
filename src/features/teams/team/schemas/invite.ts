import { z } from "zod";

export const inviteSchema = z.object({
	invitee: z.string().trim().min(1, "Enter a username or email address"),
	role: z.enum(["founder", "member"]).default("member"),
});

export type InviteInput = z.infer<typeof inviteSchema>;
export type InviteRole = InviteInput["role"];

export const INVITE_ROLES = [
	{ value: "member", label: "Member" },
	{ value: "founder", label: "Co-founder" },
] as const;
