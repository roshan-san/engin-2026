import { Page } from "~/components/shared/Page";
import { PLAN_LIMITS, PRO_MONTHLY_CREDITS } from "@convex/lib/limits";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { PageHeader } from "~/components/shared/PageHeader";
import { Row, RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
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
	{ label: "First Hackathon", value: "Free" },
];

const PRO_ROWS: readonly PlanRow[] = [
	{ label: "Members", value: `Up to ${PLAN_LIMITS.pro.members}` },
	{ label: "Stealth mode", value: PLAN_LIMITS.pro.stealth ? "Yes" : "No" },
	{
		label: "Hackathons",
		value: `${PRO_MONTHLY_CREDITS} a month included, then ${HACKATHON_PRICE_LABELS.pro} each`,
	},
	{ label: "First Hackathon", value: "Free" },
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
		<>
			<PageHeader
				width="wide"
				title="Pricing"
				meta="Founders pay to hire through Hackathons. Contributors are always free."
				actions={
					<div className="inline-flex w-fit rounded-md bg-accent p-0.5">
						{INTERVALS.map((option) => (
							<button
								key={option.value}
								type="button"
								aria-pressed={interval === option.value}
								onClick={() => setInterval(option.value)}
								className={cn(
									"rounded-[5px] px-3 py-1 text-sm font-medium transition-colors",
									interval === option.value
										? "bg-background text-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{option.label}
							</button>
						))}
					</div>
				}
			/>
			<Page className="space-y-8">
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
						price={
							isYearly ? PRO_PRICE_LABELS.yearly : PRO_PRICE_LABELS.monthly
						}
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
					<li>Every new account's first Hackathon is free.</li>
					<li>
						Pro's {PRO_MONTHLY_CREDITS} included hackathons reset each Pro
						month; unused ones don't carry over.
					</li>
					<li>
						Contributors are always free: entering a hackathon never costs
						anything.
					</li>
				</ul>
			</Page>
		</>
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
		<Card
			className={cn("gap-5 shadow-none", highlighted && "ring-2 ring-primary")}
		>
			<CardHeader>
				<div className="flex items-center justify-between gap-2">
					<SectionLabel as="h2">{title}</SectionLabel>
					{isCurrent && <Badge>Current plan</Badge>}
				</div>
				<div className="flex items-baseline gap-1">
					<p className="text-[28px] font-[650] tracking-[-0.02em] tabular-nums">
						{price}
					</p>
					{period && <span className="text-muted-foreground">{period}</span>}
				</div>
				<p className="text-sm text-muted-foreground">{priceNote}</p>
			</CardHeader>
			<CardContent>
				<RowList>
					{rows.map((row) => (
						<Row
							key={row.label}
							title={row.label}
							trailing={
								<span className="block max-w-44 whitespace-normal text-right font-medium text-foreground">
									{row.value}
								</span>
							}
						/>
					))}
				</RowList>
			</CardContent>
			{action && <CardFooter>{action}</CardFooter>}
		</Card>
	);
}
