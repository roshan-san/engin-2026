import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/work/")({
	beforeLoad: () => {
		throw redirect({ to: "/app" });
	},
	component: () => null,
});
