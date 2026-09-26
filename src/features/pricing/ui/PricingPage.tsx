import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	type BillingInterval,
	useUpgrade,
} from "~/features/pricing/hooks/useUpgrade";
import { cn } from "~/lib/utils";

const freeFeatures = [
	"Public contributor profile",
	"Explore startups",
	"Join Trial Cycles",
	"3 active Trial Cycle applications",
	"Startup workspace",
	"Team invites",
];

const proFeatures = [
	"More active applications",
	"More open Roles and Trial Cycles",
	"Advanced opportunity filters",
	"Profile and startup analytics",
	"Enhanced profile customization",
];

/** Monthly list price. Yearly is billed at 67% of annualized monthly (save 33%). */
const MONTHLY_PRICE = 10;
const YEARLY_PRICE = Math.round(MONTHLY_PRICE * 12 * 0.67);
const YEARLY_PER_MONTH = Math.round((YEARLY_PRICE / 12) * 100) / 100;

export function PricingPage() {
	const [interval, setInterval] = useState<BillingInterval>("yearly");
	const { plan, isLoading, upgrade } = useUpgrade();

	const isYearly = interval === "yearly";
	const priceLabel = isYearly ? `$${YEARLY_PER_MONTH}` : `$${MONTHLY_PRICE}`;
	const billingNote = isYearly
		? `$${YEARLY_PRICE} billed yearly`
		: "Billed monthly";

	return (
		<div className="w-full space-y-10 py-8">
			<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="text-2xl font-bold sm:text-3xl">Pricing</h1>
					<p className="mt-2 max-w-2xl text-muted-foreground">
						Start free. Upgrade when you need more applications and hiring
						capacity.
					</p>
				</div>

				<div className="inline-flex w-fit rounded-lg border border-border p-1">
					<button
						type="button"
						onClick={() => setInterval("monthly")}
						className={cn(
							"rounded-md px-4 py-2 text-sm font-medium transition-colors",
							!isYearly
								? "bg-foreground text-background"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Monthly
					</button>
					<button
						type="button"
						onClick={() => setInterval("yearly")}
						className={cn(
							"flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
							isYearly
								? "bg-foreground text-background"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Yearly
						<span
							className={cn(
								"rounded px-1.5 py-0.5 text-xs font-semibold",
								isYearly
									? "bg-background/20 text-background"
									: "bg-muted text-foreground",
							)}
						>
							Save 33%
						</span>
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Card className="shadow-none">
					<CardHeader>
						<CardTitle>Free</CardTitle>
						<p className="text-3xl font-bold">$0</p>
						<p className="text-sm text-muted-foreground">Forever free</p>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2 text-sm text-muted-foreground">
							{freeFeatures.map((feature) => (
								<li key={feature}>{feature}</li>
							))}
						</ul>
					</CardContent>
					<CardFooter>
						<Button asChild variant="outline" className="w-full">
							<Link to="/app">Back to Build</Link>
						</Button>
					</CardFooter>
				</Card>

				<Card className="border-foreground/20 shadow-none">
					<CardHeader>
						<div className="flex items-center justify-between gap-2">
							<CardTitle>Standard</CardTitle>
							{plan?.isPro && <Badge>Active</Badge>}
						</div>
						<div className="flex items-baseline gap-1">
							<p className="text-3xl font-bold">{priceLabel}</p>
							<span className="text-muted-foreground">/mo</span>
						</div>
						<p className="text-sm text-muted-foreground">
							{billingNote}
							{isYearly ? " · Save 33%" : null}
						</p>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2 text-sm text-muted-foreground">
							{proFeatures.map((feature) => (
								<li key={feature}>{feature}</li>
							))}
						</ul>
					</CardContent>
					<CardFooter>
						{plan?.isPro ? (
							<Button asChild className="w-full">
								<Link to="/app">Back to Build</Link>
							</Button>
						) : (
							<Button
								className="w-full"
								onClick={() => upgrade(interval)}
								disabled={isLoading}
							>
								{isLoading
									? "Redirecting..."
									: isYearly
										? "Upgrade yearly"
										: "Upgrade monthly"}
							</Button>
						)}
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
