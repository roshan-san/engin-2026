export const TASK_STATUSES = [
	{ value: "todo", label: "Todo" },
	{ value: "in_progress", label: "In progress" },
	{ value: "review", label: "Review" },
	{ value: "done", label: "Done" },
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number]["value"];

/** States a worker can pick directly; review is reached by submitting. */
export const WORKABLE_TASK_STATUSES = TASK_STATUSES.filter(
	(status) => status.value !== "review",
);

export const PROOF_LINK_KINDS = [
	{ value: "pr", label: "PR" },
	{ value: "commit", label: "Commit" },
	{ value: "deploy", label: "Deploy" },
	{ value: "design", label: "Design" },
	{ value: "doc", label: "Doc" },
	{ value: "demo", label: "Demo" },
	{ value: "other", label: "Link" },
] as const;

export type ProofLinkKind = (typeof PROOF_LINK_KINDS)[number]["value"];

const PROOF_LINK_PATTERNS: { kind: ProofLinkKind; pattern: RegExp }[] = [
	{ kind: "pr", pattern: /\/pull\/\d+|\/merge_requests\/\d+/ },
	{ kind: "commit", pattern: /\/commit\/[0-9a-f]{7,}/ },
	{ kind: "design", pattern: /figma\.com|dribbble\.com|behance\.net/ },
	{ kind: "doc", pattern: /docs\.google\.com|notion\.so|notion\.site/ },
	{ kind: "demo", pattern: /loom\.com|youtube\.com|youtu\.be|vimeo\.com/ },
	{ kind: "deploy", pattern: /vercel\.app|netlify\.app|pages\.dev/ },
];

/** Guesses the kind from the URL so adding proof is a single paste. */
export function inferProofLinkKind(url: string): ProofLinkKind {
	return (
		PROOF_LINK_PATTERNS.find(({ pattern }) => pattern.test(url))?.kind ??
		"other"
	);
}

export function proofLinkLabel(kind: ProofLinkKind): string {
	return PROOF_LINK_KINDS.find((item) => item.value === kind)?.label ?? "Link";
}
