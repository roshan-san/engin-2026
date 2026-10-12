import type { CardView } from "../board/types";
import { displayName } from "../../../lib/displayName";
import { relativeTime } from "../../../lib/relativeTime";

/** What shipped: the line, its links and images, and who verified it. */
export function ShippedView({ card }: { readonly card: CardView }) {
	const { shipped } = card;
	if (!shipped) return null;

	return (
		<div className="flex flex-col gap-2">
			<p className="text-sm break-words">{shipped.line}</p>
			{shipped.links.length > 0 ? (
				<ul className="flex flex-col gap-1">
					{shipped.links.map((link) => (
						<li key={link} className="min-w-0">
							<a
								href={link}
								target="_blank"
								rel="noreferrer noopener"
								className="block truncate text-sm text-link underline-offset-4 hover:underline"
							>
								{link}
							</a>
						</li>
					))}
				</ul>
			) : null}
			{shipped.imageUrls.length > 0 ? (
				<ul className="flex flex-wrap gap-2">
					{shipped.imageUrls.map((url) => (
						<li key={url}>
							<a href={url} target="_blank" rel="noreferrer noopener">
								<img
									src={url}
									alt=""
									className="size-16 rounded-md border border-border object-cover"
								/>
							</a>
						</li>
					))}
				</ul>
			) : null}
			{card.status === "done" ? (
				<p className="text-xs text-muted-foreground">
					{card.selfVerified
						? "Self-verified"
						: `Verified by ${displayName(card.verifiedBy)}${
								card.verifiedAt !== null
									? ` · ${relativeTime(card.verifiedAt, Date.now())}`
									: ""
							}`}
				</p>
			) : null}
		</div>
	);
}
