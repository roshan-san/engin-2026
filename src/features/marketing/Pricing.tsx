import { POST_INTENT_PATH } from "~/entities/place";
import { planLines } from "~/features/billing";
import { GoogleButton } from "~/features/people";
import { cn } from "~/shared/lib/cn";
import { TILE } from "~/shared/ui/tile";

/** Free next to the three Pro plans, read from PLANS. Pro is hiring only. */
export function Pricing() {
	return (
		<section id="pricing" className="flex scroll-mt-6 flex-col gap-6">
			<div>
				<h2 className="text-2xl font-semibold">Pricing</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Founders pay to publish hiring Hackathons. Participants join free.
				</p>
			</div>
			<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
				<div className={cn(TILE, "flex flex-col gap-3")}>
					<p className="text-sm font-medium">Free</p>
					<p>
						<span className="text-3xl font-semibold tabular-nums">$0</span>{" "}
						<span className="text-sm text-muted-foreground">forever</span>
					</p>
					<p className="text-sm text-muted-foreground">
						Board, Cycles, What shipped, team chat, public Startup page.
						Unlimited people.
					</p>
					<GoogleButton label="Get started" size="sm" className="mt-auto" />
				</div>
				{planLines().map((plan) => (
					<div
						key={plan.key}
						className={cn(
							TILE,
							"flex flex-col gap-3",
							plan.isHighlighted && "border-primary",
						)}
					>
						<p className="text-sm font-medium">Pro · {plan.name}</p>
						<p>
							<span className="text-3xl font-semibold tabular-nums">
								{plan.price}
							</span>{" "}
							<span className="text-sm text-muted-foreground">{plan.per}</span>
						</p>
						<p className="text-sm text-muted-foreground">{plan.hackathons}</p>
						<GoogleButton
							label="Get started"
							size="sm"
							className="mt-auto"
							returnTo={POST_INTENT_PATH}
						/>
					</div>
				))}
			</div>
			<p className="text-sm text-muted-foreground">
				One Internshala post: $34. One Hackathon on engin: $15, or about $3 on a
				longer plan.
			</p>
		</section>
	);
}
