import type { Doc, Id } from "@convex/_generated/dataModel";
import { getRouteApi } from "@tanstack/react-router";
import { StarIcon } from "lucide-react";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { UnreadDot } from "~/components/shared/UnreadDot";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { initials } from "~/lib/initials";
import { BuilderView } from "./BuilderView";
import { EveryonePanel } from "./EveryonePanel";
import { useApplicants } from "./hooks/useApplicants";
import { useReviewQueue } from "./hooks/useReviewQueue";
import { useHackathonThreads } from "./hooks/useSpace";
import { ReviewQueue } from "./ReviewQueue";
import { sidebarItems } from "./sidebarItems";

const route = getRouteApi("/_shell/_authed/s/$slug/hiring/$id");

const ITEM_CLASS =
	"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60 aria-[current=true]:bg-accent";

/** Building, deciding and done: Review, # Everyone, and each Builder. */
export function RunningView({
	hackathon,
}: {
	readonly hackathon: Doc<"hackathons">;
}) {
	const { userId } = useWorkspace();
	const applicants = useApplicants(hackathon._id);
	const { queue } = useReviewQueue(hackathon._id);
	const threads = useHackathonThreads(hackathon._id);
	const view = route.useSearch({ select: (search) => search.view });
	const navigate = route.useNavigate();
	const isClosed = hackathon.status === "done";

	const builders =
		applicants?.filter((row) => row.application.status === "building") ?? [];
	const items = sidebarItems({
		builders,
		queue: queue ?? [],
		threads: threads ?? [],
	});
	const fallback =
		hackathon.status === "building"
			? "review"
			: (builders[0]?.user._id ?? "review");
	const current = view ?? fallback;
	const builderRow = builders.find((row) => row.user._id === current);
	const privateThread = threads?.find(
		(thread) => thread.kind === "private" && thread.builder?._id === current,
	);

	function show(next: string, cardId?: Id<"cards">) {
		void navigate({ search: { view: next, card: cardId } });
	}

	const choices = [
		{ value: "review", label: `Review · ${items.reviewCount}` },
		{ value: "everyone", label: "# Everyone" },
		...items.builders.map((builder) => ({
			value: builder.userId,
			label: builder.name,
		})),
	];

	return (
		<div className="flex min-h-0 flex-1 flex-col md:flex-row">
			<nav
				aria-label="Hackathon"
				className="hidden w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border p-2 md:flex"
			>
				<div className="flex flex-col gap-0.5">
					<button
						type="button"
						aria-current={current === "review"}
						className={ITEM_CLASS}
						onClick={() => show("review")}
					>
						Review
						<span className="ml-auto text-xs tabular-nums text-muted-foreground">
							{items.reviewCount}
						</span>
					</button>
					<button
						type="button"
						aria-current={current === "everyone"}
						className={ITEM_CLASS}
						onClick={() => show("everyone")}
					>
						# Everyone
						{items.everyoneUnread ? (
							<span className="ml-auto flex">
								<UnreadDot />
							</span>
						) : null}
					</button>
				</div>
				<div className="flex flex-col gap-1">
					<div className="px-2">
						<SectionLabel as="h2">Builders</SectionLabel>
					</div>
					<ul className="flex flex-col gap-0.5">
						{items.builders.map((builder) => (
							<li key={builder.userId}>
								<button
									type="button"
									aria-current={current === builder.userId}
									className={ITEM_CLASS}
									onClick={() => show(builder.userId)}
								>
									<Avatar className="size-5">
										{builder.image ? (
											<AvatarImage src={builder.image} alt="" />
										) : null}
										<AvatarFallback className="text-[9px]">
											{initials(builder.name, builder.username)}
										</AvatarFallback>
									</Avatar>
									<span className="min-w-0 flex-1 truncate">
										{builder.name}
									</span>
									{builder.shortlisted ? (
										<StarIcon
											aria-label="Shortlisted"
											className="size-3.5 shrink-0 fill-current text-muted-foreground"
										/>
									) : null}
									{builder.unread ? <UnreadDot /> : null}
									{builder.reviewCount > 0 ? (
										<span className="text-xs tabular-nums text-muted-foreground">
											{builder.reviewCount}
										</span>
									) : null}
								</button>
							</li>
						))}
					</ul>
				</div>
			</nav>

			<div className="border-b border-border p-2 md:hidden">
				<Select value={current} onValueChange={(next) => show(next)}>
					<SelectTrigger aria-label="Show" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{choices.map((choice) => (
							<SelectItem key={choice.value} value={choice.value}>
								{choice.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<main className="flex min-h-0 min-w-0 flex-1 flex-col">
				{current === "review" ? (
					<ReviewQueue
						hackathonId={hackathon._id}
						isClosed={isClosed}
						onOpen={(builderId, cardId) => show(builderId, cardId)}
					/>
				) : current === "everyone" ? (
					<div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
						<EveryonePanel
							hackathonId={hackathon._id}
							userId={userId}
							isReadOnly={isClosed}
						/>
					</div>
				) : builderRow ? (
					<BuilderView
						key={builderRow.user._id}
						hackathon={hackathon}
						row={builderRow}
						threadId={privateThread?._id}
						isThreadUnread={privateThread?.unread ?? false}
						userId={userId}
					/>
				) : null}
			</main>
		</div>
	);
}
