import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

export type MyInvite = FunctionReturnType<typeof api.invites.listMine>[number];

/** Your open Invites; `undefined` while loading. */
export function useMyInvites() {
	return useQuery(api.invites.listMine, {});
}
