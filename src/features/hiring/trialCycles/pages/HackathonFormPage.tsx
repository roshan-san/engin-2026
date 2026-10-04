import type { Id } from "@convex/_generated/dataModel";
import { Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageLoading } from "~/components/globals/PageLoading";
import { Button } from "~/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "~/components/ui/empty";
import { HackathonForm } from "~/features/hiring/trialCycles/components/HackathonForm";
import { useHackathonDraft } from "~/features/hiring/trialCycles/hooks/useHackathonDraft";
import { defaultHackathonValues } from "~/features/hiring/trialCycles/hooks/useHackathonForm";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

type HackathonFormPageProps =
	| { readonly mode: "create" }
	| { readonly mode: "edit"; readonly trialCycleId: Id<"trialCycles"> };

/** Founder-only: members are sent back to the read-only Hiring screen. */
export function HackathonFormPage(props: HackathonFormPageProps) {
	const { slug, member } = useStartupRoute();

	if (!member) {
		return <PageLoading rows={4} />;
	}
	if (member.role !== "founder") {
		return <Navigate to="/s/$slug/hiring" params={{ slug }} replace />;
	}

	return (
		<div className="mx-auto w-full max-w-2xl space-y-6">
			<h1 className="text-xl font-semibold">
				{props.mode === "create" ? "New hackathon" : "Edit hackathon"}
			</h1>
			{props.mode === "create" ? (
				<CreateHackathon slug={slug} startupId={member.startup._id} />
			) : (
				<EditHackathon
					slug={slug}
					startupId={member.startup._id}
					trialCycleId={props.trialCycleId}
				/>
			)}
		</div>
	);
}

type FormProps = {
	readonly slug: string;
	readonly startupId: Id<"startups">;
};

function CreateHackathon({ slug, startupId }: FormProps) {
	const [initialValues] = useState(defaultHackathonValues);
	return (
		<HackathonForm
			slug={slug}
			startupId={startupId}
			initialValues={initialValues}
		/>
	);
}

function EditHackathon({
	slug,
	startupId,
	trialCycleId,
}: FormProps & { readonly trialCycleId: Id<"trialCycles"> }) {
	const draft = useHackathonDraft(startupId, trialCycleId, true);

	if (draft.kind === "loading") {
		return <PageLoading rows={6} />;
	}
	if (draft.kind !== "ready") {
		return (
			<Empty className="border border-dashed">
				<EmptyHeader>
					<EmptyTitle>
						{draft.kind === "notDraft"
							? "This hackathon can't be edited"
							: "Hackathon not found"}
					</EmptyTitle>
					<EmptyDescription>
						{draft.kind === "notDraft"
							? "Only an unpublished hackathon's details can be edited here."
							: "It may have been removed, or it belongs to another Startup."}
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button asChild variant="outline">
						<Link to="/s/$slug/hiring" params={{ slug }}>
							Back to Hiring
						</Link>
					</Button>
				</EmptyContent>
			</Empty>
		);
	}

	// Keyed and initialised once, so live updates never overwrite typing.
	return (
		<HackathonForm
			key={trialCycleId}
			slug={slug}
			startupId={startupId}
			trialCycleId={trialCycleId}
			initialValues={draft.initialValues}
		/>
	);
}
