import { createFileRoute } from "@tanstack/react-router";
import { MyPulsesPage } from "~/features/work/pulses/pages/MyPulsesPage";

export const Route = createFileRoute("/_shell/_authed/my-pulses/")({
	component: MyPulsesPage,
});
