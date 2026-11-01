import type { ReactNode } from "react";
import { displayName } from "~/shared/lib/displayName";

/** One conversation: the line, and who wrote it. A missing author reads "Someone". */
export function ConversationRow({
	line,
	author,
	trailing,
}: {
	readonly line: string;
	readonly author: Parameters<typeof displayName>[0] | null;
	readonly trailing?: ReactNode;
}) {
	return (
		<li className="flex items-start gap-3 py-2">
			<div className="flex min-w-0 flex-1 flex-col">
				<p className="text-sm break-words">{line}</p>
				<span className="text-xs text-muted-foreground">
					{author ? displayName(author) : "Someone"}
				</span>
			</div>
			{trailing}
		</li>
	);
}
