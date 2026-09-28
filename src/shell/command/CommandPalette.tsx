import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import {
	useCommands,
	useShortcutContext,
} from "~/shell/command/CommandProvider";
import { SHORTCUTS } from "~/shell/shortcuts/registry";

/**
 * The ⌘K/Ctrl+K palette (D-18–D-20, UI E7). The "Screens" group holds every
 * navigation entry, the Focused-Startup entries (only once a Startup is
 * focused), and `shortcuts.open` — never `palette.open` or `search.focus`
 * themselves.
 */
export function CommandPalette() {
	const ctx = useShortcutContext();
	const { paletteOpen, setPaletteOpen } = useCommands();

	const screenEntries = SHORTCUTS.filter((entry) => {
		if (entry.id === "palette.open" || entry.id === "search.focus") {
			return false;
		}
		if (entry.scope === "startup") {
			return ctx.focusedSlug !== null;
		}
		return true;
	});

	function runEntry(entry: (typeof SHORTCUTS)[number]) {
		setPaletteOpen(false);
		entry.action(ctx);
	}

	return (
		<CommandDialog
			open={paletteOpen}
			onOpenChange={setPaletteOpen}
			title="Command palette"
			description="Jump to a screen, Startup or Cycle"
		>
			<CommandInput placeholder="Search Engin…" />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Screens">
					{screenEntries.map((entry) => (
						<CommandItem key={entry.id} onSelect={() => runEntry(entry)}>
							<span className="truncate">{entry.label}</span>
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
