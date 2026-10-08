import { CommandPalette } from "~/shell/command/CommandPalette";
import {
	CommandProvider,
	ShellKeyboard,
} from "~/shell/command/CommandProvider";
import { ShortcutSheet } from "~/shell/command/ShortcutSheet";
import { CrumbProvider } from "~/shell/crumbs/CrumbProvider";
import { TopBar } from "~/shell/topbar/TopBar";

/**
 * Signed-in frame: a sticky top bar over the page. `CommandProvider` wraps
 * it so the palette and shortcut sheet only mount in the signed-in shell.
 */
export function AppShell({ children }: { readonly children: React.ReactNode }) {
	return (
		<CommandProvider>
			<CrumbProvider>
				<div className="flex min-h-dvh flex-col bg-background text-foreground">
					<TopBar />
					<main className="flex-1 px-4 py-6 md:px-6">{children}</main>
				</div>
			</CrumbProvider>
			<ShellKeyboard />
			<CommandPalette />
			<ShortcutSheet />
		</CommandProvider>
	);
}
