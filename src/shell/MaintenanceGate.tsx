import type { ReactNode } from "react";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { useMaintenance } from "./useMaintenance";

/**
 * Shows the maintenance page instead of the app while maintenance is on. It's
 * live: flipping `site/maintenance:set` in Convex switches every open tab.
 */
export function MaintenanceGate({
	children,
}: {
	readonly children: ReactNode;
}) {
	const underMaintenance = useMaintenance();

	if (underMaintenance === undefined) return <GlobalSpinner />;
	if (underMaintenance) return <MaintenancePage />;
	return children;
}

function MaintenancePage() {
	return (
		<main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
			<p className="font-semibold text-2xl tracking-tight">engin</p>
			<h1 className="text-lg">We're getting things ready.</h1>
			<p className="max-w-sm text-muted-foreground text-sm">
				engin is down for maintenance. Check back soon.
			</p>
		</main>
	);
}
