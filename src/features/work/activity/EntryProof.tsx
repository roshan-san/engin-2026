import { ExternalLink } from "lucide-react";
import { cn } from "~/lib/utils";
import { displayName } from "../../../lib/displayName";
import { ActorAvatar } from "./ActorAvatar";
import { type EntryView, linkLabel } from "./record";

type ProofCard = NonNullable<EntryView["card"]>;

/** A verified Card's proof: its links, its images and who verified it. */
export function EntryProof({
	entry,
	card,
	size = "inline",
}: {
	readonly entry: EntryView;
	readonly card: ProofCard;
	/** `panel` gives images the panel's full width. */
	readonly size?: "inline" | "panel";
}) {
	const hasProof = card.links.length + card.imageUrls.length > 0;

	return (
		<div className="flex flex-col gap-3">
			{card.links.length > 0 ? (
				<ul className="flex flex-col gap-1.5">
					{card.links.map((link) => (
						<li key={link} className="min-w-0">
							<a
								href={link}
								target="_blank"
								rel="noreferrer noopener"
								className="flex min-w-0 items-center gap-1.5 text-sm text-link underline-offset-4 hover:underline"
							>
								<ExternalLink aria-hidden className="size-3.5 shrink-0" />
								<span className="truncate">{linkLabel(link)}</span>
							</a>
						</li>
					))}
				</ul>
			) : null}
			{card.imageUrls.length > 0 ? (
				<ul
					className={cn(
						size === "panel"
							? "grid grid-cols-2 gap-2"
							: "flex flex-wrap gap-2",
					)}
				>
					{card.imageUrls.map((url) => (
						<li key={url}>
							<a
								href={url}
								target="_blank"
								rel="noreferrer noopener"
								className="block overflow-hidden rounded-md border border-border transition-opacity hover:opacity-85"
							>
								<img
									src={url}
									alt="Proof"
									className={cn(
										"object-cover",
										size === "panel" ? "aspect-4/3 w-full" : "size-24",
									)}
								/>
							</a>
						</li>
					))}
				</ul>
			) : null}
			{hasProof ? null : (
				<p className="text-xs text-muted-foreground">No links or images</p>
			)}
			<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
				{entry.selfVerified ? (
					"Self-verified by the Founder"
				) : (
					<>
						Verified by
						<ActorAvatar person={card.verifier} className="size-4" />
						<span className="text-foreground">
							{displayName(card.verifier)}
						</span>
					</>
				)}
			</p>
		</div>
	);
}
