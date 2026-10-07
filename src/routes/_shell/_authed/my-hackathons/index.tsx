import { createFileRoute } from "@tanstack/react-router";
import { MyHackathonsPage } from "~/features/hiring/myHackathons/pages/MyHackathonsPage";

export const Route = createFileRoute("/_shell/_authed/my-hackathons/")({
	component: MyHackathonsPage,
});
