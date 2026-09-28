/**
 * Signed-in frame. The desktop sidebar (plan 01-06) mounts as the first child
 * of the outer row; this plan ships no header, unlike the old top-header layout.
 */
export function AppShell({ children }: { readonly children: React.ReactNode }) {
	return (
		<div className="flex min-h-dvh bg-background text-foreground">
			<div className="flex min-w-0 flex-1 flex-col">
				<main className="flex-1 px-4 py-4 md:px-6">{children}</main>
			</div>
		</div>
	);
}
