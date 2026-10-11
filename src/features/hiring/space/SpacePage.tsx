import type { Doc } from "@convex/_generated/dataModel";
import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";
import { GlobalNotFound } from "~/components/globals/GlobalNotFound";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { PanelHeader } from "~/components/shared/PanelHeader";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { termsLine } from "../jobChips";
import { STAGE, stageDate } from "../stage";
import { CopyLinkButton } from "./CopyLinkButton";
import { DraftView } from "./DraftView";
import { useApplicants } from "./hooks/useApplicants";
import { useSpace } from "./hooks/useSpace";
import { RunningView } from "./RunningView";
import { ScreeningView } from "./ScreeningView";

const route = getRouteApi("/_shell/_authed/s/$slug/hiring/$id");

/** The Founder's Hackathon space; what it shows follows the Hackathon's status. */
export function SpacePage() {
	const { id } = route.useParams();
	const space = useSpace(id);

	if (space === undefined) {
		return <GlobalSpinner />;
	}
	if (space === null) {
		return <GlobalNotFound />;
	}

	const { hackathon, cards } = space;
	return (
		<div className="flex h-full min-h-0 flex-col">
			<SpaceHeader hackathon={hackathon} />
			{hackathon.status === "draft" ? (
				<DraftView hackathon={hackathon} cards={cards} />
			) : hackathon.status === "open" ? (
				<ScreeningView hackathon={hackathon} cards={cards} />
			) : (
				<RunningView hackathon={hackathon} />
			)}
		</div>
	);
}

/** The terms, where the Hackathon is, and the way to the page Applicants see. The job is in the bar. */
function SpaceHeader({ hackathon }: { readonly hackathon: Doc<"hackathons"> }) {
	const applicants = useApplicants(hackathon._id);
	const hires =
		applicants?.filter((row) => row.application.decision === "hired").length ??
		0;
	const stage = STAGE[hackathon.status];

	return (
		<PanelHeader className="gap-3 md:px-6">
			<h1 className="min-w-0 truncate text-sm text-muted-foreground">
				{termsLine(hackathon.job)}
			</h1>
			<Badge variant="status" tone={stage.tone} className="shrink-0">
				{stage.label}
			</Badge>
			<span className="hidden truncate text-xs text-muted-foreground md:inline">
				{hackathon.status === "done"
					? hires > 0
						? `${hires} hired`
						: "No hire"
					: stageDate(hackathon)}
			</span>
			{hackathon.status !== "draft" ? (
				<div className="ml-auto flex shrink-0 items-center gap-1">
					<CopyLinkButton hackathonId={hackathon._id} variant="ghost" />
					<Button asChild variant="ghost" size="sm">
						<Link to="/hackathons/$id" params={{ id: hackathon._id }}>
							Public page
							<ArrowUpRightIcon />
						</Link>
					</Button>
				</div>
			) : null}
		</PanelHeader>
	);
}
