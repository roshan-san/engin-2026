import { Search } from "lucide-react";
import { ShortcutHint } from "~/shell/shortcuts/ShortcutHint";

/**
 * Opens the command palette. Looks like an input on desktop, an icon button
 * on phone.
 */
export function SearchField({ onOpen }: { readonly onOpen: () => void }) {
	return (
		<button
			type="button"
			aria-label="Search"
			onClick={onOpen}
			className="flex size-8 shrink-0 items-center justify-center gap-2 rounded-md text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 md:w-60 md:justify-start md:border md:border-input md:bg-background md:px-2.5 md:hover:border-foreground/25 md:hover:bg-background"
		>
			<Search className="size-4 shrink-0" />
			<span className="hidden flex-1 text-left text-subtle-foreground md:inline">
				Find…
			</span>
			<ShortcutHint id="palette.open" className="hidden md:inline" />
		</button>
	);
}
