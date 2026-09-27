import { z } from "zod";
import { USERNAME_PATTERN } from "~/lib/username";

const optionalUrl = z
	.string()
	.trim()
	.max(200, "Link is too long")
	.refine((value) => value === "" || /^https?:\/\/\S+\.\S+/.test(value), {
		message: "Link must start with http:// or https://",
	})
	.transform((value) => value || undefined)
	.optional();

export const profileSchema = z.object({
	name: z
		.string()
		.trim()
		.max(80, "Name must be under 80 characters")
		.transform((value) => value || undefined)
		.optional(),
	username: z
		.string()
		.trim()
		.toLowerCase()
		.max(20)
		.refine((value) => value === "" || USERNAME_PATTERN.test(value), {
			message:
				"Username must be 3–20 characters, start with a letter, and use lowercase letters, numbers, or underscores",
		})
		.transform((value) => value || undefined)
		.optional(),
	headline: z
		.string()
		.trim()
		.max(80, "Headline must be under 80 characters")
		.transform((value) => value || undefined)
		.optional(),
	bio: z
		.string()
		.trim()
		.max(280, "Bio must be under 280 characters")
		.transform((value) => value || undefined)
		.optional(),
	skills: z
		.string()
		.trim()
		.max(400)
		.transform((value) =>
			value
				? value
						.split(",")
						.map((skill) => skill.trim())
						.filter(Boolean)
						.slice(0, 10)
				: undefined,
		)
		.optional(),
	location: z
		.string()
		.trim()
		.max(80, "Location must be under 80 characters")
		.transform((value) => value || undefined)
		.optional(),
	githubUrl: optionalUrl,
	linkedinUrl: optionalUrl,
	portfolioUrl: optionalUrl,
	hideFromExplore: z.boolean(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
