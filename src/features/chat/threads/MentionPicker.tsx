import { HashIcon } from "lucide-react";
import { Command, CommandItem, CommandList } from "~/components/ui/command";

export type MentionOption = { readonly _id: string; readonly title: string };

/** Board Cards to mention, above the composer. The textarea keeps focus and drives it. */
export function MentionPicker({
	options,
	activeId,
	onActiveChange,
	onPick,
}: {
	readonly options: readonly MentionOption[];
	readonly activeId: string;
	readonly onActiveChange: (id: string) => void;
	readonly onPick: (option: MentionOption) => void;
}) {
	return (
		<div
			id="mention-picker"
			className="absolute inset-x-0 bottom-full z-10 mb-1 overflow-hidden rounded-md border border-border bg-popover shadow-md"
		>
			<Command
				shouldFilter={false}
				// Keep focus in the textarea while clicking.
				onMouseDown={(e) => e.preventDefault()}
				value={activeId}
				onValueChange={onActiveChange}
			>
				<CommandList className="max-h-48">
					{options.map((option) => (
						<CommandItem
							key={option._id}
							value={option._id}
							onSelect={() => onPick(option)}
						>
							<HashIcon />
							<span className="truncate">{option.title}</span>
						</CommandItem>
					))}
				</CommandList>
			</Command>
		</div>
	);
}
