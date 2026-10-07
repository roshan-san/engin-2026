import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useRoles } from "~/features/hiring/roles/hooks/useRoles";
import { CreditBadge } from "~/features/hiring/screen/components/CreditBadge";
import {
	type HackathonListItem,
	HackathonRow,
} from "~/features/hiring/screen/components/HackathonRow";
import { HiringEmptyState } from "~/features/hiring/screen/components/HiringEmptyState";
import { RoleRow } from "~/features/hiring/screen/components/RoleRow";
import { useCheckoutWatch } from "~/features/hiring/screen/hooks/useCheckoutWatch";
import { useCredits } from "~/features/hiring/screen/hooks/useCredits";
import { useHiringScreen } from "~/features/hiring/screen/hooks/useHiringScreen";
import { HACKATHON_STATUS_GROUPS } from "~/features/hiring/hackathons/constants";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

/** The founders' hiring home: hackathons and Roles; members see it read-only. */
export function HiringPage() {
	const { slug, member } = useStartupRoute();
	const startupId = member?.startup._id;
	const isFounder = member?.role === "founder";

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-xl font-semibold">Hiring</h1>
				<div className="flex flex-wrap items-center gap-3">
					{isFounder ? <CreditBadge /> : null}
					{isFounder ? (
						<Button asChild size="sm">
							<Link to="/s/$slug/hiring/new" params={{ slug }}>
								New Hackathon
							</Link>
						</Button>
					) : null}
				</div>
			</header>

			<Tabs defaultValue="hackathons" className="gap-4">
				<TabsList>
					<TabsTrigger value="hackathons">Hackathons</TabsTrigger>
					<TabsTrigger value="roles">Roles</TabsTrigger>
				</TabsList>
				<TabsContent value="hackathons">
					<HackathonsTab
						slug={slug}
						startupId={startupId}
						isFounder={isFounder}
					/>
				</TabsContent>
				<TabsContent value="roles">
					<RolesTab startupId={startupId} isFounder={isFounder} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

type TabProps = {
	readonly startupId: Id<"startups"> | undefined;
	readonly isFounder: boolean;
};

function HackathonsTab({
	slug,
	startupId,
	isFounder,
}: TabProps & { readonly slug: string }) {
	const { hackathons } = useHiringScreen(startupId);
	const { count: creditCount } = useCredits(isFounder);
	useCheckoutWatch(hackathons, creditCount);

	if (hackathons === undefined) {
		return <PageLoading rows={3} />;
	}
	if (hackathons.length === 0) {
		return <HiringEmptyState slug={slug} isFounder={isFounder} />;
	}

	return (
		<div className="space-y-6">
			{HACKATHON_STATUS_GROUPS.map((group) => {
				const items = hackathons.filter((hackathon: HackathonListItem) =>
					group.statuses.includes(hackathon.status),
				);
				if (items.length === 0) {
					return null;
				}
				return (
					<section key={group.label} className="space-y-2">
						<h2 className="text-sm font-medium text-muted-foreground">
							{group.label}
						</h2>
						<ul className="space-y-2">
							{items.map((hackathon) => (
								<HackathonRow
									key={hackathon._id}
									slug={slug}
									hackathon={hackathon}
									isFounder={isFounder}
									creditCount={isFounder ? creditCount : undefined}
								/>
							))}
						</ul>
					</section>
				);
			})}
		</div>
	);
}

function RolesTab({ startupId, isFounder }: TabProps) {
	const { openRoles, closedRoles, close, closingRoleId } = useRoles(startupId);

	if (openRoles === undefined || closedRoles === undefined) {
		return <PageLoading rows={3} />;
	}
	if (openRoles.length === 0 && closedRoles.length === 0) {
		return (
			<p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
				No Roles yet.
				{isFounder ? " Add one when you set up a hackathon." : null}
			</p>
		);
	}

	return (
		<ul className="space-y-2">
			{[...openRoles, ...closedRoles].map((role) => (
				<RoleRow
					key={role._id}
					role={role}
					isFounder={isFounder}
					isClosing={closingRoleId === role._id}
					onClose={() => void close(role._id)}
				/>
			))}
		</ul>
	);
}
