import { ROLE_TEXT_LIMITS } from "@convex/lib/limits";
import { z } from "zod";
import { requiredText } from "~/lib/validation";

const headcountMessage = "Headcount must be a whole number of at least 1";

/** The inline "+ New Role" form; skills are typed comma-separated. */
export const roleSchema = z.object({
	title: requiredText("Role title", ROLE_TEXT_LIMITS.title),
	type: z.string().min(1, "Pick a Role type"),
	skills: z.string().transform((value) =>
		value
			.split(",")
			.map((skill) => skill.trim())
			.filter(Boolean)
			.slice(0, ROLE_TEXT_LIMITS.skills.maxItems),
	),
	description: requiredText("Role description", ROLE_TEXT_LIMITS.description),
	headcount: z.coerce
		.number(headcountMessage)
		.int(headcountMessage)
		.min(1, headcountMessage),
});
