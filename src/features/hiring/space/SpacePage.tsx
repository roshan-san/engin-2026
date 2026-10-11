import type { Doc } from "@convex/_generated/dataModel";
import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";
import { GlobalNotFound } from "~/components/globals/GlobalNotFound";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { PanelHeader } from "~/components/shared/PanelHeader";
import { jobLine } from "../jobChips";
import { DraftView } from "./DraftView";
import { useApplicants } from "./hooks/useApplicants";
import { useSpace } from "./hooks/useSpace";
import { ScreeningView } from "./ScreeningView";
import { spaceStatusLine } from "./spaceStatus";

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
		<div className="flex h-[calc(100dvh-3.5rem-1px)] min-h-0 flex-col">
			<SpaceHeader hackathon={hackathon} />
			{hackathon.status === "draft" ? (
				<DraftView hackathon={hackathon} cards={cards} />
			) : hackathon.status === "open" ? (
				<ScreeningView hackathon={hackathon} />
			) : null}
		</div>
	);
}

/** The job, where the Hackathon is, and a way to the page Applicants see. */
function SpaceHeader({ hackathon }: { readonly hackathon: Doc<"hackathons"> }) {
	const applicants = useApplicants(hackathon._id);
	const hires =
		applicants?.filter((row) => row.application.decision === "hired").length ??
		0;

	return (
		<PanelHeader className="gap-3 md:px-6">
			<h1 className="truncate text-sm font-medium">{jobLine(hackathon.job)}</h1>
			<span className="hidden truncate text-sm text-muted-foreground sm:inline">
				{spaceStatusLine(hackathon, hires)}
			</span>
			{hackathon.status !== "draft" ? (
				<Link
					to="/hackathons/$id"
					params={{ id: hackathon._id }}
					className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
				>
					Public page
					<ArrowUpRightIcon className="size-3.5" />
				</Link>
			) : null}
		</PanelHeader>
	);
}
