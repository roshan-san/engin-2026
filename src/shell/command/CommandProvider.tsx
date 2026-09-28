import { useNavigate } from "@tanstack/react-router";
import {
	createContext,
	useCallback,
	useContext,
	useState,
	type ReactNode,
} from "react";
import { useFocusedStartup } from "~/shell/hooks/useFocusedStartup";
import type { ShortcutContext } from "~/shell/shortcuts/registry";
import { useShortcuts } from "~/shell/shortcuts/useShortcuts";

type CommandContextValue = {
	paletteOpen: boolean;
	setPaletteOpen: (open: boolean) => void;
	togglePalette: () => void;
	sheetOpen: boolean;
	setSheetOpen: (open: boolean) => void;
	openShortcutSheet: () => void;
	focusSearch: () => void;
};

const CommandContext = createContext<CommandContextValue | null>(null);

/**
 * Owns the mod+K palette and `?` sheet open state. `togglePalette` and
 * `openShortcutSheet` are mutually exclusive (edge SHELL-05/concurrency): at
 * most one of the palette and the sheet is ever open.
 */
export function CommandProvider({
	children,
}: {
	readonly children: ReactNode;
}) {
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [sheetOpen, setSheetOpen] = useState(false);

	const togglePalette = useCallback(() => {
		setSheetOpen(false);
		setPaletteOpen((open) => !open);
	}, []);

	const openShortcutSheet = useCallback(() => {
		setPaletteOpen(false);
		setSheetOpen(true);
	}, []);

	// Placeholder until page search registration lands: `/` always opens the
	// palette. Wired to the registered search input separately.
	const focusSearch = useCallback(() => {
		setSheetOpen(false);
		setPaletteOpen(true);
	}, []);

	return (
		<CommandContext.Provider
			value={{
				paletteOpen,
				setPaletteOpen,
				togglePalette,
				sheetOpen,
				setSheetOpen,
				openShortcutSheet,
				focusSearch,
			}}
		>
			{children}
		</CommandContext.Provider>
	);
}

export function useCommands(): CommandContextValue {
	const ctx = useContext(CommandContext);
	if (!ctx) {
		throw new Error("useCommands must be used within a CommandProvider");
	}
	return ctx;
}

/** Builds the `ShortcutContext` every registry action runs against. */
export function useShortcutContext(): ShortcutContext {
	const navigate = useNavigate();
	const { focused } = useFocusedStartup();
	const { togglePalette, openShortcutSheet, focusSearch } = useCommands();

	return {
		navigate,
		focusedSlug: focused?.startup.slug ?? null,
		togglePalette,
		openShortcutSheet,
		focusSearch,
	};
}

/** Mounts the global keydown listener. Renders nothing. */
export function ShellKeyboard() {
	const ctx = useShortcutContext();
	useShortcuts(ctx);
	return null;
}
