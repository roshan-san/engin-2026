import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/startup/")({
	beforeLoad: () => {
		throw redirect({ to: "/app" });
	},
	component: () => null,
});
