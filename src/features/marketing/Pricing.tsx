import { GoogleButton } from "~/features/people/auth/GoogleButton";
import { planLines } from "./pricingText";

/** The three Pro plans, read from PLANS. */
export function Pricing() {
	return (
		<section id="pricing" className="flex scroll-mt-6 flex-col gap-6">
			<div>
				<h2 className="text-xl font-semibold tracking-tight">Pricing</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Founders pay to publish hiring Hackathons. Builders join free.
				</p>
			</div>
			<div className="grid gap-3 md:grid-cols-3">
				{planLines().map((plan) => (
					<div
						key={plan.key}
						className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
					>
						<p className="text-sm font-medium">{plan.name}</p>
						<p>
							<span className="text-3xl font-semibold tabular-nums">
								{plan.price}
							</span>{" "}
							<span className="text-sm text-muted-foreground">{plan.per}</span>
						</p>
						<p className="text-sm text-muted-foreground">{plan.hackathons}</p>
						<GoogleButton label="Get started" size="sm" className="mt-auto" />
					</div>
				))}
			</div>
		</section>
	);
}
