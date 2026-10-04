import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { useCommands } from "~/shell/command/CommandProvider";
import type { ShortcutScope } from "~/shell/shortcuts/registry";
import { SHORTCUTS } from "~/shell/shortcuts/registry";
import { ShortcutHint } from "~/shell/shortcuts/ShortcutHint";

const SCOPE_LABELS: Record<ShortcutScope, string> = {
	global: "Global",
	navigation: "Navigation",
	startup: "Startup",
};

/**
 * The `?` sheet (UI E8): one row per registry entry with a key, grouped by
 * scope in registry order. The registry always holds at least the mod+K and `?`
 * entries (D-19), so this list is never empty.
 */
export function ShortcutSheet() {
	const { sheetOpen, setSheetOpen } = useCommands();
	const entries = SHORTCUTS.filter((entry) => entry.key !== null);
	const scopes = Array.from(new Set(entries.map((entry) => entry.scope)));

	return (
		<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
			<SheetContent side="right" className="flex flex-col gap-0 p-0">
				<SheetHeader>
					<SheetTitle>Keyboard shortcuts</SheetTitle>
				</SheetHeader>
				<div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
					{scopes.map((scope) => (
						<div key={scope} className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								{SCOPE_LABELS[scope]}
							</p>
							{entries
								.filter((entry) => entry.scope === scope)
								.map((entry) => (
									<div
										key={entry.id}
										className="flex items-center justify-between gap-2 py-1"
									>
										<span className="min-w-0 flex-1 truncate text-sm">
											{entry.label}
										</span>
										<ShortcutHint id={entry.id} />
									</div>
								))}
						</div>
					))}
				</div>
			</SheetContent>
		</Sheet>
	);
}
