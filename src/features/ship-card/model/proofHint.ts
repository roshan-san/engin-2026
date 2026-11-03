import type { Discipline } from "~/shared/config/disciplines";

const HINTS: Record<Discipline, string> = {
	developer: "Link the pull request or the live page.",
	designer: "Link the design file or add a screenshot.",
	marketing: "Link the post or campaign, and add the numbers.",
	sales: "Say who said yes, and to what.",
	other: "Link it, or add a screenshot.",
};

/** What proof to attach, by what the owner does on this Card. */
export function proofHint(discipline: Discipline | null): string {
	return HINTS[discipline ?? "other"];
}
