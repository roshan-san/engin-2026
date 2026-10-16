import { splitBody } from "@convex/shared/mentions";
import { Link } from "@tanstack/react-router";
import type { MessageView } from "./useMessages";

/** A message's text, with Card mentions as links that open the Card. */
export function MessageBody({
	body,
	mentions,
	slug,
}: {
	readonly body: string;
	readonly mentions: MessageView["mentions"];
	/** The Startup whose Board the mentions open. Only Team threads have mentions. */
	readonly slug: string | undefined;
}) {
	return (
		<p className="text-sm break-words whitespace-pre-wrap">
			{splitBody(body).map((part, index) => {
				// Parts never reorder, so the position is a stable key.
				const key = `${index}`;
				if (part.kind === "text") return <span key={key}>{part.text}</span>;

				const mention = mentions.find((m) => m.cardId === part.cardId);
				if (!mention || !slug) {
					return (
						<span key={key} className="text-muted-foreground">
							#card
						</span>
					);
				}
				return (
					<Link
						key={key}
						to="/s/$slug/board"
						params={{ slug }}
						search={{ card: mention.cardId }}
						className="inline-flex max-w-full items-center rounded-md bg-muted px-1.5 align-bottom text-foreground hover:bg-accent focus-ring"
					>
						<span className="truncate"># {mention.title}</span>
					</Link>
				);
			})}
		</p>
	);
}
