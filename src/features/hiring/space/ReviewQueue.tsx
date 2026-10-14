import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { EmptyState } from "~/components/EmptyState";
import { Kbd } from "~/components/Kbd";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { PersonName } from "~/features/people/PersonName";
import { ShippedView } from "~/features/work/cards/ShippedView";
import { initials } from "~/lib/initials";
import { cn } from "~/lib/utils";
import { useListKeys } from "./useListKeys";
import { useReviewQueue } from "./useReviewQueue";

/** Every Card waiting for you, across all Builders. J/K move, V verifies, Enter opens. */
export function ReviewQueue({
	hackathonId,
	isClosed,
	onOpen,
}: {
	readonly hackathonId: Id<"hackathons">;
	readonly isClosed: boolean;
	/** Opens the Card in its Builder's Board. */
	readonly onOpen: (builderId: Id<"users">, cardId: Id<"cards">) => void;
}) {
	const { queue, verify } = useReviewQueue(hackathonId);
	const [active, setActive] = useState<string>();
	const ids = queue?.map((card) => card._id) ?? [];
	const activeId = ids.find((id) => id === active) ?? ids[0];

	function cardOf(id: string) {
		return queue?.find((card) => card._id === id);
	}

	useListKeys({
		ids,
		activeId,
		onMove: (id) => {
			setActive(id);
			document.getElementById(`review-${id}`)?.focus();
		},
		keys: {
			v: (id) => {
				const card = cardOf(id);
				if (card && !isClosed) void verify(card._id);
			},
			enter: (id) => {
				const card = cardOf(id);
				if (card?.owner) onOpen(card.owner._id, card._id);
			},
		},
		isEnabled: true,
	});

	if (queue === undefined) {
		return (
			<div className="flex flex-col gap-3 p-6">
				<Skeleton className="h-24" />
				<Skeleton className="h-24" />
			</div>
		);
	}
	if (queue.length === 0) {
		return (
			<EmptyState
				title="Nothing to review."
				body="Cards land here when a Builder ships them."
			/>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="min-h-0 flex-1 overflow-y-auto">
				<ol className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-4 md:p-6">
					{queue.map((card) => (
						<li key={card._id}>
							<article
								id={`review-${card._id}`}
								// biome-ignore lint/a11y/noNoninteractiveTabindex: rows are focused by J/K
								tabIndex={0}
								onFocus={() => setActive(card._id)}
								className={cn(
									"flex flex-col gap-3 rounded-lg border border-border p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
									card._id === activeId && "border-foreground/25 bg-accent/40",
								)}
							>
								<header className="flex items-center gap-2">
									<Avatar className="size-6">
										{card.owner?.image ? (
											<AvatarImage src={card.owner.image} alt="" />
										) : null}
										<AvatarFallback className="text-[10px]">
											{initials(
												card.owner?.name ?? null,
												card.owner?.username ?? null,
											)}
										</AvatarFallback>
									</Avatar>
									<PersonName person={card.owner} className="text-sm" />
									<button
										type="button"
										className="min-w-0 truncate text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/60"
										onClick={() =>
											card.owner && onOpen(card.owner._id, card._id)
										}
									>
										{card.title}
									</button>
									{isClosed ? null : (
										<Button
											size="sm"
											className="ml-auto shrink-0"
											onClick={() => void verify(card._id)}
										>
											Verify
										</Button>
									)}
								</header>
								<ShippedView card={card} />
							</article>
						</li>
					))}
				</ol>
			</div>
			<p className="hidden shrink-0 items-center justify-center gap-1.5 border-t border-border px-3 py-2 text-xs text-muted-foreground md:flex">
				<Kbd>J</Kbd>
				<Kbd>K</Kbd> move · <Kbd>V</Kbd> verify · <Kbd>Enter</Kbd> open
			</p>
		</div>
	);
}
