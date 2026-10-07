import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { PageHeader } from "~/components/shared/PageHeader";
import { RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { HACKATHON_STATUS_GROUPS } from "~/features/hiring/hackathons/constants";
import { NewRoleDialog } from "~/features/hiring/roles/components/NewRoleDialog";
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
import {
	matchesTeam,
	TeamFilter,
	type TeamFilterValue,
} from "~/features/teams/team/components/TeamFilter";
import {
	type TeamSummary,
	useTeams,
} from "~/features/teams/team/hooks/useTeams";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

/** The founders' hiring home: hackathons and Roles; members see it read-only. */
export function HiringPage() {
	const { slug, member } = useStartupRoute();
	const startupId = member?.startup._id;
	const isFounder = member?.role === "founder";
	const { teams } = useTeams(startupId);
	const [teamFilter, setTeamFilter] = useState<TeamFilterValue>("all");

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6">
			<PageHeader
				hidden
				title="Hiring"
				actions={
					isFounder ? (
						<>
							<CreditBadge />
							{startupId ? <NewRoleDialog startupId={startupId} /> : null}
							<Button asChild size="sm">
								<Link to="/s/$slug/hiring/new" params={{ slug }}>
									New Hackathon
								</Link>
							</Button>
						</>
					) : null
				}
			/>

			<Tabs defaultValue="hackathons" className="gap-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<TabsList>
						<TabsTrigger value="hackathons">Hackathons</TabsTrigger>
						<TabsTrigger value="roles">Roles</TabsTrigger>
					</TabsList>
					<TeamFilter
						teams={teams}
						value={teamFilter}
						onChange={setTeamFilter}
					/>
				</div>
				<TabsContent value="hackathons">
					<HackathonsTab
						slug={slug}
						startupId={startupId}
						isFounder={isFounder}
						teams={teams}
						teamFilter={teamFilter}
					/>
				</TabsContent>
				<TabsContent value="roles">
					<RolesTab
						startupId={startupId}
						isFounder={isFounder}
						teams={teams}
						teamFilter={teamFilter}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

type TabProps = {
	readonly startupId: Id<"startups"> | undefined;
	readonly isFounder: boolean;
	readonly teams: TeamSummary[] | undefined;
	readonly teamFilter: TeamFilterValue;
};

function HackathonsTab({
	slug,
	startupId,
	isFounder,
	teams,
	teamFilter,
}: TabProps & { readonly slug: string }) {
	const { hackathons: listed } = useHiringScreen(startupId);
	const hackathons = listed?.filter((hackathon) =>
		matchesTeam(hackathon.teamId, teamFilter),
	);
	const { count: creditCount } = useCredits(isFounder);
	useCheckoutWatch(listed, creditCount);

	if (hackathons === undefined) {
		return <PageLoading rows={3} />;
	}
	if (hackathons.length === 0) {
		return <HiringEmptyState slug={slug} isFounder={isFounder} />;
	}

	return (
		<div className="space-y-8">
			{HACKATHON_STATUS_GROUPS.map((group) => {
				const items = hackathons.filter((hackathon: HackathonListItem) =>
					group.statuses.includes(hackathon.status),
				);
				if (items.length === 0) {
					return null;
				}
				return (
					<section key={group.label} className="space-y-2">
						<SectionLabel>{group.label}</SectionLabel>
						<RowList>
							{items.map((hackathon) => (
								<HackathonRow
									key={hackathon._id}
									slug={slug}
									hackathon={hackathon}
									isFounder={isFounder}
									creditCount={isFounder ? creditCount : undefined}
									teamName={
										teams?.find((team) => team._id === hackathon.teamId)?.name
									}
								/>
							))}
						</RowList>
					</section>
				);
			})}
		</div>
	);
}

function RolesTab({ startupId, isFounder, teams, teamFilter }: TabProps) {
	const { roles, close, closingRoleId, setTeam } = useRoles(startupId);
	const visible = roles?.filter((role) => matchesTeam(role.teamId, teamFilter));
	const openRoles = visible?.filter((role) => role.status === "open");
	const closedRoles = visible?.filter((role) => role.status === "closed");

	if (openRoles === undefined || closedRoles === undefined) {
		return <PageLoading rows={3} />;
	}
	if (openRoles.length === 0 && closedRoles.length === 0) {
		return (
			<EmptyState
				title="No Roles yet."
				body={isFounder ? "Add one when you set up a hackathon." : undefined}
			/>
		);
	}

	return (
		<RowList>
			{[...openRoles, ...closedRoles].map((role) => (
				<RoleRow
					key={role._id}
					role={role}
					isFounder={isFounder}
					isClosing={closingRoleId === role._id}
					onClose={() => void close(role._id)}
					teams={teams}
					onSetTeam={(teamId) => void setTeam(role._id, teamId)}
				/>
			))}
		</RowList>
	);
}
