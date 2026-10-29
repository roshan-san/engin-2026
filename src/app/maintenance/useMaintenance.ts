import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** Whether engin is down for maintenance, live; `undefined` until Convex answers. */
export function useMaintenance(): boolean | undefined {
	return useQuery(api.site.maintenance.status, {});
}
