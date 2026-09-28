import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/_authed/s/$slug/")({
	beforeLoad: ({ params }) => {
		throw redirect({ to: "/s/$slug/cycles", params });
	},
});
