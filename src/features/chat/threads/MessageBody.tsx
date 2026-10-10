import { splitBody } from "@convex/chat/mentions.rules";
import { Link } from "@tanstack/react-router";
import { useWorkspace } from "~/features/work/board/StartupContext";
import type { MessageView } from "./hooks/useMessages";

/** A message's text, with Card mentions as links that open the Card. */
export function MessageBody({
	body,
	mentions,
}: {
	readonly body: string;
	readonly mentions: MessageView["mentions"];
}) {
	const { startup } = useWorkspace();

	return (
		<p className="text-sm break-words whitespace-pre-wrap">
			{splitBody(body).map((part, index) => {
				// Parts never reorder, so the position is a stable key.
				const key = `${index}`;
				if (part.kind === "text") return <span key={key}>{part.text}</span>;

				const mention = mentions.find((m) => m.cardId === part.cardId);
				if (!mention) {
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
						params={{ slug: startup.slug }}
						search={{ card: mention.cardId }}
						className="inline-flex max-w-full items-center rounded-md bg-muted px-1.5 align-bottom text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60"
					>
						<span className="truncate"># {mention.title}</span>
					</Link>
				);
			})}
		</p>
	);
}
