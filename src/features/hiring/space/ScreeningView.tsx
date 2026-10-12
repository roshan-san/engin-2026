import type { Doc, Id } from "@convex/_generated/dataModel";
import { MAX_BUILDERS } from "@convex/shared/limits";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { EmptyState } from "~/components/EmptyState";
import { Kbd } from "~/components/Kbd";
import { PanelHeader } from "~/components/PanelHeader";
import { Segmented } from "~/components/Segmented";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { useIsMobile } from "~/lib/use-mobile";
import { HackathonPost } from "../public/HackathonPost";
import { ApplicantDetail } from "./ApplicantDetail";
import { ApplicantList } from "./ApplicantList";
import { sortApplicants } from "./applicantSort";
import { CopyLinkButton } from "./CopyLinkButton";
import { EveryonePanel } from "./EveryonePanel";
import { useApplicants, useScreening } from "./useApplicants";
import { useListKeys } from "./useListKeys";

const route = getRouteApi("/_shell/_authed/s/$slug/hiring/$id");

const SORTS = [
	{ value: "newest", label: "Newest" },
	{ value: "rating", label: "Rating" },
] as const;

const PANES = [
	{ value: "applicant", label: "Applicant" },
	{ value: "everyone", label: "# Everyone" },
	{ value: "post", label: "Post" },
] as const;

/** Before the start: pick up to 10 Builders from the Applicants, J/K, A, D. */
export function ScreeningView({
	hackathon,
	cards,
}: {
	readonly hackathon: Doc<"hackathons">;
	readonly cards: Doc<"cards">[];
}) {
	const { userId, startup } = useWorkspace();
	const applicants = useApplicants(hackathon._id);
	const { accept, decline } = useScreening();
	const [sort, setSort] = useState<"newest" | "rating">("newest");
	const [pane, setPane] = useState<"applicant" | "everyone" | "post">(
		"applicant",
	);
	// On a phone, # Everyone opens in the sheet the Applicant uses.
	const [isEveryoneOpen, setIsEveryoneOpen] = useState(false);
	const view = route.useSearch({ select: (search) => search.view });
	const navigate = route.useNavigate();
	const isMobile = useIsMobile();

	const rows = applicants ? sortApplicants(applicants, sort) : [];
	const ids = rows.map((row) => row.application._id);
	const activeId = ids.find((id) => id === view) ?? ids[0];
	// With nobody to show yet, the pane shows the post being shared.
	const shownPane = pane === "applicant" && !activeId ? "post" : pane;
	const builderCount = rows.filter(
		(row) => row.application.status === "building",
	).length;

	function select(id: string) {
		void navigate({ search: (prev) => ({ ...prev, view: id }), replace: true });
	}

	/** Acts on a row, then moves on to the next one. */
	async function act(
		id: string,
		action: (id: Id<"applications">) => Promise<boolean>,
	) {
		const index = ids.findIndex((rowId) => rowId === id);
		const target = ids[index];
		if (!target) return;
		const next = ids[index + 1];
		if ((await action(target)) && next) select(next);
	}

	useListKeys({
		ids,
		activeId,
		onMove: select,
		keys: {
			a: (id) => void act(id, accept),
			d: (id) => void act(id, decline),
		},
		isEnabled: isMobile === false && shownPane === "applicant",
	});

	const detail = activeId ? (
		<ApplicantDetail
			key={activeId}
			applicationId={activeId}
			onAccept={() => void act(activeId, accept)}
			onDecline={() => void act(activeId, decline)}
		/>
	) : null;

	return (
		<div className="flex min-h-0 flex-1">
			<section
				aria-label="Applicants"
				className="flex min-h-0 w-full flex-col border-border md:w-[360px] md:shrink-0 md:border-r"
			>
				<PanelHeader className="gap-2">
					<span className="text-sm">
						<span className="font-medium tabular-nums">
							{builderCount}/{MAX_BUILDERS}
						</span>{" "}
						<span className="text-muted-foreground">Builders</span>
					</span>
					<Segmented
						label="Sort"
						options={SORTS}
						value={sort}
						onChange={setSort}
						className="ml-auto"
					/>
					<Button
						variant="ghost"
						size="sm"
						className="md:hidden"
						onClick={() => setIsEveryoneOpen(true)}
					>
						# Everyone
					</Button>
				</PanelHeader>
				<div className="min-h-0 flex-1 overflow-y-auto">
					{applicants === undefined ? (
						<div className="flex flex-col gap-2 p-3">
							<Skeleton className="h-9" />
							<Skeleton className="h-9" />
						</div>
					) : rows.length === 0 ? (
						<EmptyState
							title="No applicants yet."
							body="Share the page. Applications close when it starts."
							action={<CopyLinkButton hackathonId={hackathon._id} />}
						/>
					) : (
						<ApplicantList
							rows={rows}
							activeId={activeId}
							onSelect={(id) => {
								select(id);
								setPane("applicant");
								setIsEveryoneOpen(false);
							}}
						/>
					)}
				</div>
				{rows.length > 0 ? (
					<p className="hidden shrink-0 items-center gap-1.5 border-t border-border px-3 py-2 text-xs text-muted-foreground md:flex">
						<Kbd>J</Kbd>
						<Kbd>K</Kbd> move · <Kbd>A</Kbd> accept · <Kbd>D</Kbd> decline
					</p>
				) : null}
			</section>

			<section className="hidden min-h-0 min-w-0 flex-1 flex-col md:flex">
				<PanelHeader>
					<Segmented
						label="Show"
						options={PANES}
						value={shownPane}
						onChange={setPane}
					/>
				</PanelHeader>
				{isMobile === false ? (
					shownPane === "everyone" ? (
						<EveryonePanel hackathonId={hackathon._id} userId={userId} />
					) : shownPane === "post" ? (
						<div className="min-h-0 flex-1 overflow-y-auto">
							<div className="mx-auto w-full max-w-2xl px-6 py-8">
								<HackathonPost
									post={{
										startupName: startup.name,
										job: hackathon.job,
										problem: hackathon.problem,
										cards: cards.map((card) => card.title),
										weeks: hackathon.weeks,
										startsAt: hackathon.startsAt,
										buildersGet: hackathon.buildersGet ?? null,
									}}
								/>
							</div>
						</div>
					) : (
						detail
					)
				) : null}
			</section>

			<Sheet
				open={isMobile === true && (view !== undefined || isEveryoneOpen)}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						setIsEveryoneOpen(false);
						void navigate({ search: (prev) => ({ ...prev, view: undefined }) });
					}
				}}
			>
				<SheetContent side="bottom" className="h-[85dvh] gap-0">
					<SheetHeader className="sr-only">
						<SheetTitle>
							{isEveryoneOpen ? "# Everyone" : "Applicant"}
						</SheetTitle>
						<SheetDescription>
							{isEveryoneOpen ? "Talk to every Builder." : "Accept or decline."}
						</SheetDescription>
					</SheetHeader>
					{isMobile !== true ? null : isEveryoneOpen ? (
						<EveryonePanel hackathonId={hackathon._id} userId={userId} />
					) : (
						detail
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
