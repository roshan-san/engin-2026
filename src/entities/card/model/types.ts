import type { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

/** A Card as the Board sees it. */
export type CardView = FunctionReturnType<typeof api.cards.listBoard>[number];
