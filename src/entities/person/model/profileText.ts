type Outcome = "built" | "finalist" | "hired";
type StartupRef = { readonly name: string; readonly slug: string };

const OUTCOMES = {
	built: "Built",
	finalist: "Finalist",
	hired: "Hired",
} as const satisfies Record<Outcome, string>;

export function outcomeLabel<O extends Outcome>(o: O): (typeof OUTCOMES)[O] {
	return OUTCOMES[o];
}

/** "Hired · Frontend at Acme". */
export function hackathonLine(h: {
	readonly outcome: Outcome;
	readonly job: { readonly title: string };
	readonly startup: StartupRef;
}): string {
	return `${outcomeLabel(h.outcome)} · ${h.job.title} at ${h.startup.name}`;
}

/** "38 cards at Acme", or "500+ cards at Acme" past the read cap. */
export function workLine(w: {
	readonly startup: StartupRef;
	readonly count: number;
	readonly capped: boolean;
}): string {
	const count = w.capped ? `${w.count}+` : String(w.count);
	return `${count} ${w.count === 1 && !w.capped ? "card" : "cards"} at ${w.startup.name}`;
}
