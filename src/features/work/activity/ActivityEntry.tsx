import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";
import { displayName } from "../cards/displayName";
import { type EntryView, entryText } from "./record";

const ROW = "block w-full px-2 py-2 text-left text-sm";

/** One Activity line; a verified Card opens to show its proof. */
export function ActivityEntry({ entry }: { readonly entry: EntryView }) {
	const text = entryText(entry);
	const { card } = entry;

	if (!card) {
		return <li className={ROW}>{text}</li>;
	}

	return (
		<li>
			<Collapsible>
				<CollapsibleTrigger
					className={cn(ROW, "rounded-md transition-colors hover:bg-accent")}
				>
					{text}
				</CollapsibleTrigger>
				<CollapsibleContent className="flex flex-col gap-2 px-2 pb-3">
					<p className="text-sm font-medium break-words">{card.title}</p>
					{card.links.length > 0 ? (
						<ul className="flex flex-col gap-1">
							{card.links.map((link) => (
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
					{card.imageUrls.length > 0 ? (
						<ul className="flex flex-wrap gap-2">
							{card.imageUrls.map((url) => (
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
					<p className="text-xs text-muted-foreground">
						{entry.selfVerified
							? "Self-verified"
							: `Verified by ${displayName(card.verifier)}`}
					</p>
				</CollapsibleContent>
			</Collapsible>
		</li>
	);
}
