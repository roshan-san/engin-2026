import { z } from "zod";

export const inviteSchema = z.object({
	email: z
		.string()
		.trim()
		.toLowerCase()
		.min(1, "Enter an email address")
		.email("Enter a valid email address"),
	role: z.enum(["founder", "member"]).default("member"),
});

export type InviteInput = z.infer<typeof inviteSchema>;
