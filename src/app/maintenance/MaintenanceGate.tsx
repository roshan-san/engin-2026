import { Navigate, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { GlobalSpinner } from "~/shared/ui/GlobalSpinner";
import { maintenanceRedirect } from "./maintenanceRedirect";
import { useMaintenance } from "./useMaintenance";

/**
 * Sends everyone to /maintenance while maintenance is on, and home when it goes
 * off. It's live: flipping `maintenance:set` in Convex moves every open tab.
 */
export function MaintenanceGate({
	children,
}: {
	readonly children: ReactNode;
}) {
	const underMaintenance = useMaintenance();
	const { pathname } = useLocation();

	if (underMaintenance === undefined) return <GlobalSpinner />;
	const to = maintenanceRedirect(underMaintenance, pathname);
	if (to) return <Navigate to={to} replace />;
	return children;
}
