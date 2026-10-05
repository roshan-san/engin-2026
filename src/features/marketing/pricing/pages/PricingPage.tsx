import { PLAN_LIMITS, PRO_MONTHLY_CREDITS } from "@convex/lib/limits";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
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
	HACKATHON_PRICE_LABELS,
	PRO_PRICE_LABELS,
	PRO_YEARLY_SAVING_LABEL,
} from "~/features/marketing/pricing/constants";
import {
	type BillingInterval,
	useUpgrade,
} from "~/features/marketing/pricing/hooks/useUpgrade";
import { GoogleButton } from "~/features/people/auth/components/GoogleButton";
import { cn } from "~/lib/utils";

type PlanRow = { readonly label: string; readonly value: string };

const FREE_ROWS: readonly PlanRow[] = [
	{ label: "Members", value: `Up to ${PLAN_LIMITS.free.members}` },
	{ label: "Stealth mode", value: PLAN_LIMITS.free.stealth ? "Yes" : "No" },
	{
		label: "Hackathons",
		value: `${HACKATHON_PRICE_LABELS.free} each`,
	},
	{ label: "First hackathon", value: "Free" },
];

const PRO_ROWS: readonly PlanRow[] = [
	{ label: "Members", value: `Up to ${PLAN_LIMITS.pro.members}` },
	{ label: "Stealth mode", value: PLAN_LIMITS.pro.stealth ? "Yes" : "No" },
	{
		label: "Hackathons",
		value: `${PRO_MONTHLY_CREDITS} a month included, then ${HACKATHON_PRICE_LABELS.pro} each`,
	},
	{ label: "First hackathon", value: "Free" },
];

const INTERVALS: readonly { value: BillingInterval; label: string }[] = [
	{ value: "monthly", label: "Monthly" },
	{ value: "yearly", label: "Yearly" },
];

export function PricingPage() {
	const [interval, setInterval] = useState<BillingInterval>("yearly");
	const {
		isAuthenticated,
		isAuthLoading,
		plan,
		canUpgrade,
		isLoading,
		upgrade,
	} = useUpgrade();

	const isYearly = interval === "yearly";
	const isReady = !isAuthLoading && (!isAuthenticated || plan !== undefined);
	const isPro = plan?.isPro ?? false;
	const isFreeFounder = isAuthenticated && !isPro && canUpgrade;

	function proAction(): ReactNode {
		if (!isReady) {
			return null;
		}
		if (!isAuthenticated) {
			return <GoogleButton label="Sign in to go Pro" returnTo="/pricing" />;
		}
		if (isPro) {
			return null;
		}
		if (canUpgrade) {
			return (
				<Button
					className="w-full"
					onClick={() => upgrade(interval)}
					disabled={isLoading}
				>
					{isLoading
						? "Redirecting..."
						: isYearly
							? "Go Pro yearly"
							: "Go Pro monthly"}
				</Button>
			);
		}
		return (
			<div className="w-full space-y-3">
				<p className="text-sm text-muted-foreground">
					Pro is for startup founders. Contributors are always free.
				</p>
				<Button asChild variant="outline" className="w-full">
					<Link to="/startups/new">Create a Startup</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full space-y-8 py-8">
			<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="text-2xl font-bold sm:text-3xl">Pricing</h1>
					<p className="mt-2 max-w-2xl text-muted-foreground">
						Founders pay to hire through hackathons. Contributors are always
						free.
					</p>
				</div>

				<div className="inline-flex w-fit rounded-lg border border-border p-1">
					{INTERVALS.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => setInterval(option.value)}
							className={cn(
								"rounded-md px-4 py-2 text-sm font-medium transition-colors",
								interval === option.value
									? "bg-foreground text-background"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<PlanCard
					title="Free"
					price="₹0"
					priceNote="Free forever"
					rows={FREE_ROWS}
					isCurrent={isFreeFounder}
				/>
				<PlanCard
					title="Pro"
					price={isYearly ? PRO_PRICE_LABELS.yearly : PRO_PRICE_LABELS.monthly}
					period={isYearly ? "/year" : "/month"}
					priceNote={
						isYearly
							? `Save ${PRO_YEARLY_SAVING_LABEL} against paying monthly`
							: "Billed monthly"
					}
					rows={PRO_ROWS}
					isCurrent={isPro}
					highlighted
					action={proAction()}
				/>
			</div>

			<ul className="space-y-1 text-sm text-muted-foreground">
				<li>Every new account's first hackathon is free.</li>
				<li>
					Pro's {PRO_MONTHLY_CREDITS} included hackathons reset each Pro month;
					unused ones don't carry over.
				</li>
				<li>
					Contributors are always free: entering a hackathon never costs
					anything.
				</li>
			</ul>
		</div>
	);
}

type PlanCardProps = {
	readonly title: string;
	readonly price: string;
	readonly period?: string;
	readonly priceNote: string;
	readonly rows: readonly PlanRow[];
	readonly isCurrent: boolean;
	readonly highlighted?: boolean;
	readonly action?: ReactNode;
};

function PlanCard({
	title,
	price,
	period,
	priceNote,
	rows,
	isCurrent,
	highlighted = false,
	action,
}: PlanCardProps) {
	return (
		<Card className={cn("shadow-none", highlighted && "border-foreground/20")}>
			<CardHeader>
				<div className="flex items-center justify-between gap-2">
					<CardTitle>{title}</CardTitle>
					{isCurrent && <Badge>Current plan</Badge>}
				</div>
				<div className="flex items-baseline gap-1">
					<p className="text-3xl font-bold">{price}</p>
					{period && <span className="text-muted-foreground">{period}</span>}
				</div>
				<p className="text-sm text-muted-foreground">{priceNote}</p>
			</CardHeader>
			<CardContent>
				<dl className="divide-y divide-border text-sm">
					{rows.map((row) => (
						<div
							key={row.label}
							className="flex items-start justify-between gap-4 py-2"
						>
							<dt className="text-muted-foreground">{row.label}</dt>
							<dd className="text-right font-medium">{row.value}</dd>
						</div>
					))}
				</dl>
			</CardContent>
			{action && <CardFooter>{action}</CardFooter>}
		</Card>
	);
}
