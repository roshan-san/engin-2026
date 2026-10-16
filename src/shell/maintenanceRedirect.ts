export const MAINTENANCE_PATH = "/maintenance";

/** Where the router should send you for this maintenance state; `null` to stay put. */
export function maintenanceRedirect(
	underMaintenance: boolean,
	pathname: string,
): string | null {
	const onMaintenancePage = pathname === MAINTENANCE_PATH;
	if (underMaintenance && !onMaintenancePage) return MAINTENANCE_PATH;
	if (!underMaintenance && onMaintenancePage) return "/";
	return null;
}
