import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";
import { AppPage, BackLink } from "~/components/AppPage";
import { GlobalNotFound } from "~/components/GlobalNotFound";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { roleLabel } from "../jobChips";
import { STAGE, stageDate } from "../stage";
import { CopyLinkButton } from "./CopyLinkButton";
import { DraftView } from "./DraftView";
import { RunningView } from "./RunningView";
import { ScreeningView } from "./ScreeningView";
import { useApplicants } from "./useApplicants";
import { useSpace } from "./useSpace";

const route = getRouteApi("/_shell/_authed/s/$slug/hiring/$id");

/** The Founder's Hackathon space; what it shows follows the Hackathon's status. */
export function SpacePage() {
	const { id } = route.useParams();
	const { startup } = useWorkspace();
	const space = useSpace(id);

	if (space === undefined) {
		return <GlobalSpinner fill />;
	}
	// Another of your Startups' Hackathons isn't found under this one's slug.
	if (space === null || space.hackathon.startupId !== startup._id) {
		return <GlobalNotFound />;
	}

	return <SpaceBody space={space} slug={startup.slug} />;
}

/** The job and where the Hackathon is in the page bar, then the view for its status. */
function SpaceBody({
	space,
	slug,
}: {
	readonly space: NonNullable<ReturnType<typeof useSpace>>;
	readonly slug: string;
}) {
	const { hackathon, cards } = space;
	const applicants = useApplicants(hackathon._id);
	const hires =
		applicants?.filter((row) => row.application.decision === "hired").length ??
		0;
	const stage = STAGE[hackathon.status];

	return (
		<AppPage
			width="full"
			bar={{
				back: (
					<BackLink
						label="Hiring"
						link={{ to: "/s/$slug/hiring", params: { slug } }}
					/>
				),
				title: (
					<h1 className="truncate text-sm font-medium">
						{roleLabel(hackathon.job.role)}
					</h1>
				),
				badge: (
					<Badge variant="status" tone={stage.tone} className="shrink-0">
						{stage.label}
						<span className="hidden font-normal sm:inline">
							{" · "}
							{hackathon.status === "done"
								? hires > 0
									? `${hires} hired`
									: "No hire"
								: stageDate(hackathon)}
						</span>
					</Badge>
				),
				actions:
					hackathon.status !== "draft" ? (
						<>
							<CopyLinkButton hackathonId={hackathon._id} variant="ghost" />
							<Button asChild variant="ghost" size="sm">
								<Link
									to="/hackathons/$id"
									params={{ id: hackathon._id }}
									aria-label="Public page"
								>
									<span className="hidden sm:inline">Public page</span>
									<ArrowUpRightIcon />
								</Link>
							</Button>
						</>
					) : null,
			}}
		>
			{hackathon.status === "draft" ? (
				<DraftView hackathon={hackathon} cards={cards} />
			) : hackathon.status === "open" ? (
				<ScreeningView hackathon={hackathon} cards={cards} />
			) : (
				<RunningView hackathon={hackathon} />
			)}
		</AppPage>
	);
}
