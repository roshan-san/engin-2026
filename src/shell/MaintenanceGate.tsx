import { type ReactNode, useEffect, useState } from "react";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { passHash, resolveGate } from "./maintenance";

/** Shows the maintenance page instead of the app on a deployment with a pass set. */
export function MaintenanceGate({
	children,
}: {
	readonly children: ReactNode;
}) {
	const [gate, setGate] = useState<"checking" | "open" | "locked">(
		passHash ? "checking" : "open",
	);

	useEffect(() => {
		if (!passHash) return;
		const fragment = window.location.hash;
		resolveGate(passHash, fragment).then((result) => {
			// Keep the pass out of the address bar and history.
			if (fragment === "#lock" || fragment.startsWith("#unlock=")) {
				history.replaceState(
					history.state,
					"",
					window.location.pathname + window.location.search,
				);
			}
			setGate(result);
		});
	}, []);

	if (gate === "checking") return <GlobalSpinner />;
	if (gate === "locked") return <MaintenancePage />;
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
