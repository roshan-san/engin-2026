import type { ReactNode } from "react";

const WEEK_CARDS = [
	{ person: "Asha", title: "Pricing page", status: "In progress" },
	{ person: "Ravi", title: "Signup flow", status: "Review" },
	{ person: "Meera", title: "10 user calls", status: "Done" },
] as const;

const BUILDERS = [
	{ name: "Builder A", work: "4 Cards approved", outcome: "Shortlist" },
	{ name: "Builder B", work: "3 Cards approved", outcome: "Shortlist" },
	{ name: "Builder C", work: "1 Card approved", outcome: "Not this time" },
] as const;

function MockFrame({ children }: { readonly children: ReactNode }) {
	return (
		<div
			aria-hidden
			className="w-full rounded-xl border border-border bg-card p-4 md:p-5"
		>
			{children}
		</div>
	);
}

/** A static week: each person's work on one board. */
export function WeekMock() {
	return (
		<MockFrame>
			<p className="text-xs font-medium text-muted-foreground">This week</p>
			<ul className="mt-2 flex flex-col divide-y divide-border">
				{WEEK_CARDS.map((card) => (
					<li
						key={card.title}
						className="flex items-baseline justify-between gap-4 py-2.5 text-sm"
					>
						<span className="min-w-0">
							<span className="text-muted-foreground">{card.person} · </span>
							{card.title}
						</span>
						<span className="shrink-0 text-xs text-muted-foreground">
							{card.status}
						</span>
					</li>
				))}
			</ul>
		</MockFrame>
	);
}

/** A static Done Card: what shipped, with the link that proves it. */
export function DoneCardMock() {
	return (
		<MockFrame>
			<p className="text-xs font-medium text-muted-foreground">Done</p>
			<p className="mt-1 text-lg font-semibold">Pricing table</p>
			<p className="mt-3 text-xs font-medium text-muted-foreground">
				What got done?
			</p>
			<p className="mt-1 text-sm">
				Live on the pricing page, with annual plans.
			</p>
			<p className="mt-1 text-sm text-primary underline underline-offset-4">
				yourstartup.com/pricing
			</p>
			<p className="mt-3 text-xs font-medium text-success">✓ Approved</p>
		</MockFrame>
	);
}

/** Static Hackathon rows: the work decides, and everyone gets an answer. */
export function BuildersMock() {
	return (
		<MockFrame>
			<ul className="flex flex-col divide-y divide-border">
				{BUILDERS.map((builder) => (
					<li
						key={builder.name}
						className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
					>
						<div className="min-w-0">
							<p className="text-sm font-medium">{builder.name}</p>
							<p className="text-xs text-muted-foreground">{builder.work}</p>
						</div>
						<span className="shrink-0 rounded-sm bg-muted px-2 py-1 text-xs font-medium">
							{builder.outcome}
						</span>
					</li>
				))}
			</ul>
		</MockFrame>
	);
}
