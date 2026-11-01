import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

/** Old links and remembered places open the Cycle. */
export const Route = createFileRoute("/_shell/_authed/s/$slug/board")({
	validateSearch: z.object({ card: z.string().optional() }),
	beforeLoad: ({ params, search }) => {
		throw redirect({
			to: "/s/$slug/cycle",
			params: { slug: params.slug },
			search: { card: search.card },
		});
	},
});
