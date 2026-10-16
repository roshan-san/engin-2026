/** The page at /maintenance, shown to everyone while maintenance is on. */
export function MaintenancePage() {
	return (
		<main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
			<p className="text-2xl font-semibold">engin</p>
			<h1 className="text-lg">We're getting things ready.</h1>
			<p className="max-w-sm text-muted-foreground text-sm">
				engin is down for maintenance. Check back soon.
			</p>
		</main>
	);
}
