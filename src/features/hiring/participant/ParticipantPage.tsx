import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";
import { useState } from "react";
import { AppPage } from "~/components/AppPage";
import { DetailPanel } from "~/components/DetailPanel";
import { Segmented } from "~/components/Segmented";
import { UnreadDot } from "~/components/UnreadDot";
import { Button } from "~/components/ui/button";
import { useDetailPanel } from "~/components/useDetailPanel";
import { ThreadPanel } from "~/features/chat";
import { Board, CardPanel, type CardView, ShipDialog } from "~/features/work";
import { roleLabel } from "../jobChips";
import { useHackathonThreads } from "../space/useSpace";
import { DecisionBanner } from "./DecisionBanner";
import { useParticipant } from "./ParticipantGate";

const route = getRouteApi("/_shell/_authed/h/$id/");

/** A Participant's own Board on a Hackathon, beside Everyone and the Founder. */
export function ParticipantPage() {
	const { page, userId, status } = useParticipant();
	const { card: cardId, panel = "everyone" } = route.useSearch();
	const navigate = route.useNavigate();
	const [shipping, setShipping] = useState<CardView | null>(null);
	const threads = useHackathonThreads(page._id);
	const everyone = threads?.find((t) => t.kind === "everyone");
	const founder = threads?.find((t) => t.kind === "private");
	const current = panel === "founder" ? founder : everyone;
	const isAnyUnread = (everyone?.unread ?? false) || (founder?.unread ?? false);

	function closeCard() {
		void navigate({ search: (prev) => ({ ...prev, card: undefined }) });
	}

	const detail = useDetailPanel(cardId !== undefined, closeCard);
	const onClose = detail.isMobile ? detail.close : undefined;

	const switcher = (
		<Segmented
			label="Panel"
			options={[
				{
					value: "everyone",
					label: (
						<>
							Everyone
							{everyone?.unread && panel !== "everyone" ? <UnreadDot /> : null}
						</>
					),
				},
				{
					value: "founder",
					label: (
						<>
							Founder
							{founder?.unread && panel !== "founder" ? <UnreadDot /> : null}
						</>
					),
				},
			]}
			value={panel}
			onChange={(next) =>
				void navigate({ search: (prev) => ({ ...prev, panel: next }) })
			}
		/>
	);

	const card = cardId ? (
		<CardPanel
			key={cardId}
			cardId={cardId}
			backLabel="Threads"
			isBackUnread={isAnyUnread}
			onBack={detail.back}
			onClose={onClose}
			onShip={setShipping}
		/>
	) : null;
	const own = (
		<ThreadPanel
			key={panel}
			threadId={current?._id}
			title={switcher}
			userId={userId}
			placeholder={panel === "founder" ? "Message the Founder" : "Ask Everyone"}
			emptyNote={
				panel === "founder"
					? "Only you and the Founder see this."
					: "Ask here. Everyone sees it."
			}
			isReadOnly={page.status === "done"}
			onClose={onClose}
		/>
	);

	return (
		<AppPage
			width="full"
			bar={{
				title: (
					<h1 className="flex min-w-0 items-baseline gap-1.5 truncate text-sm">
						<span className="font-medium">{roleLabel(page.job.role)}</span>
						<span aria-hidden className="text-muted-foreground">
							·
						</span>
						<Link
							to="/hackathons/$id"
							params={{ id: page._id }}
							className="flex min-w-0 items-center gap-0.5 truncate text-muted-foreground hover:text-foreground focus-ring"
						>
							<span className="truncate">{page.startup.name}</span>
							<ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0" />
						</Link>
					</h1>
				),
				actions: (
					<Button
						variant="ghost"
						size="sm"
						className="md:hidden"
						onClick={detail.open}
					>
						Threads
						{isAnyUnread ? <UnreadDot /> : null}
					</Button>
				),
			}}
			notice={
				page.myApplication?.decision ? (
					<DecisionBanner
						startupName={page.startup.name}
						application={{
							...page.myApplication,
							decision: page.myApplication.decision,
						}}
					/>
				) : status.note ? (
					<p className="border-b border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground md:px-6">
						{status.note}
					</p>
				) : null
			}
			panel={
				<DetailPanel
					shows={detail.shows}
					title={cardId ? "Card" : "Threads"}
					description="Talk with the Founder."
					onClose={detail.close}
					item={card}
					fallback={own}
				/>
			}
		>
			<Board
				openCardId={cardId}
				onShip={setShipping}
				onOpen={(id) =>
					void navigate({ search: (prev) => ({ ...prev, card: id }) })
				}
				onClose={closeCard}
			/>
			{shipping ? (
				<ShipDialog card={shipping} onClose={() => setShipping(null)} />
			) : null}
		</AppPage>
	);
}
