import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "~/features/app/layout/AppLayout";

export const Route = createFileRoute("/app")({
	component: AppLayout,
});
