import { Badge } from "~/components/ui/badge";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "~/components/ui/command";
import {
	useCommands,
	useShortcutContext,
} from "~/shell/command/CommandProvider";
import { usePaletteData } from "~/shell/command/usePaletteData";
import { SHORTCUTS } from "~/shell/shortcuts/registry";
import { ShortcutHint } from "~/shell/shortcuts/ShortcutHint";
import { StartupAvatar } from "~/shell/sidebar/StartupAvatar";

/**
 * The mod+K palette (D-18–D-20, UI E7). Fixed group order: Screens,
 * Startups, Cycles (edge SHELL-05/ordering). Below `md` the dialog goes
 * full-screen (D-17).
 */
export function CommandPalette() {
	const ctx = useShortcutContext();
	const { paletteOpen, setPaletteOpen } = useCommands();
	const { memberships, cycles, cyclesLoading } = usePaletteData();
	const { focusedSlug } = ctx;

	const screenEntries = SHORTCUTS.filter((entry) => {
		if (entry.id === "palette.open" || entry.id === "search.focus") {
			return false;
		}
		if (entry.scope === "startup") {
			return focusedSlug !== null;
		}
		return true;
	});

	function runEntry(entry: (typeof SHORTCUTS)[number]) {
		setPaletteOpen(false);
		entry.action(ctx);
	}

	function goToStartup(slug: string) {
		setPaletteOpen(false);
		ctx.navigate({ to: "/s/$slug/cycles", params: { slug } });
	}

	function goToCycle(slug: string, cycleId: string) {
		setPaletteOpen(false);
		ctx.navigate({
			to: "/s/$slug/cycles/$cycleId",
			params: { slug, cycleId },
		});
	}

	return (
		<CommandDialog
			open={paletteOpen}
			onOpenChange={setPaletteOpen}
			title="Command palette"
			description="Jump to a screen, Startup or Cycle"
			className="max-md:top-0 max-md:left-0 max-md:h-dvh max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none max-md:border-0"
		>
			<CommandInput placeholder="Search Engin…" />
			<CommandList>
				{!cyclesLoading ? <CommandEmpty>No results found.</CommandEmpty> : null}
				<CommandGroup heading="Screens">
					{screenEntries.map((entry) => (
						<CommandItem key={entry.id} onSelect={() => runEntry(entry)}>
							<span className="min-w-0 flex-1 truncate">{entry.label}</span>
							{entry.key ? (
								<CommandShortcut>
									<ShortcutHint id={entry.id} />
								</CommandShortcut>
							) : null}
						</CommandItem>
					))}
				</CommandGroup>

				{memberships.length > 0 ? (
					<CommandGroup heading="Startups">
						{memberships.map(({ startup, role }) => (
							<CommandItem
								key={startup._id}
								onSelect={() => goToStartup(startup.slug)}
							>
								<StartupAvatar name={startup.name} />
								<span className="min-w-0 flex-1 truncate">{startup.name}</span>
								<Badge variant="secondary" className="shrink-0 text-xs">
									{role}
								</Badge>
							</CommandItem>
						))}
					</CommandGroup>
				) : null}

				{focusedSlug ? (
					<CommandGroup heading="Cycles">
						{cycles.map((cycle) => (
							<CommandItem
								key={cycle._id}
								onSelect={() => goToCycle(focusedSlug, cycle._id)}
							>
								<span className="min-w-0 flex-1 truncate">{cycle.title}</span>
							</CommandItem>
						))}
					</CommandGroup>
				) : null}
			</CommandList>
		</CommandDialog>
	);
}
