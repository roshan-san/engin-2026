import { useNavigate } from "@tanstack/react-router";
import {
	createContext,
	useCallback,
	useContext,
	useRef,
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
	registerSearch: (el: HTMLInputElement | null) => void;
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
	const searchRef = useRef<HTMLInputElement | null>(null);

	const togglePalette = useCallback(() => {
		setSheetOpen(false);
		setPaletteOpen((open) => !open);
	}, []);

	const openShortcutSheet = useCallback(() => {
		setPaletteOpen(false);
		setSheetOpen(true);
	}, []);

	const registerSearch = useCallback((el: HTMLInputElement | null) => {
		searchRef.current = el;
	}, []);

	// D-20: focus the page's registered search input if it's mounted,
	// otherwise open the palette — so `/` always does something.
	const focusSearch = useCallback(() => {
		const el = searchRef.current;
		if (el?.isConnected) {
			el.focus();
			el.select();
			return;
		}
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
				registerSearch,
			}}
		>
			{children}
		</CommandContext.Provider>
	);
}

export function useCommands(): Omit<CommandContextValue, "registerSearch"> {
	const ctx = useContext(CommandContext);
	if (!ctx) {
		throw new Error("useCommands must be used within a CommandProvider");
	}
	return ctx;
}

/**
 * Returns a ref callback for a page's search input (D-20). Without a
 * provider (signed out) it's a no-op, so pages can call it unconditionally.
 */
export function useRegisterSearch(): (el: HTMLInputElement | null) => void {
	const ctx = useContext(CommandContext);
	if (!ctx) {
		return () => {};
	}
	return ctx.registerSearch;
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
