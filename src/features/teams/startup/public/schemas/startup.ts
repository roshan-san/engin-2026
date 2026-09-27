import { z } from "zod";

const optionalUrl = z
	.string()
	.trim()
	.max(200, "Link is too long")
	.refine((value) => value === "" || /^https?:\/\/\S+\.\S+/.test(value), {
		message: "Link must start with http:// or https://",
	})
	.transform((value) => value || undefined)
	.optional();

export const createStartupSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, "Startup name must be at least 2 characters")
		.max(60, "Startup name must be under 60 characters"),
	tagline: z
		.string()
		.trim()
		.max(120, "Tagline must be under 120 characters")
		.transform((value) => value || undefined)
		.optional(),
	description: z
		.string()
		.trim()
		.max(2000, "Description must be under 2000 characters")
		.transform((value) => value || undefined)
		.optional(),
	category: z
		.string()
		.trim()
		.transform((value) => value || undefined)
		.optional(),
	stage: z.enum(["idea", "pre-seed", "seed", "series-a", "growth"]).optional(),
	website: optionalUrl,
	twitterUrl: optionalUrl,
	linkedinUrl: optionalUrl,
});

export type CreateStartupInput = z.infer<typeof createStartupSchema>;

const optionalSection = (max: number, label: string) =>
	z
		.string()
		.trim()
		.max(max, `${label} must be under ${max} characters`)
		.transform((value) => value || undefined)
		.optional();

export const pitchSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, "Startup name must be at least 2 characters")
		.max(60, "Startup name must be under 60 characters"),
	tagline: optionalSection(120, "Tagline"),
	description: optionalSection(2000, "Description"),
	category: z
		.string()
		.trim()
		.transform((value) => value || undefined)
		.optional(),
	stage: z.enum(["idea", "pre-seed", "seed", "series-a", "growth"]).optional(),
	website: optionalUrl,
	twitterUrl: optionalUrl,
	linkedinUrl: optionalUrl,
	githubUrl: optionalUrl,
	problem: optionalSection(2000, "Problem"),
	solution: optionalSection(2000, "Solution"),
	product: optionalSection(2000, "Product"),
	traction: optionalSection(2000, "Traction"),
	teamBlurb: optionalSection(500, "Team blurb"),
	techStack: z.string().trim().optional(),
	location: optionalSection(80, "Location"),
	remote: z.boolean().optional(),
	isPublic: z.boolean(),
});

export type PitchInput = z.infer<typeof pitchSchema>;
