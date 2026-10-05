import { createFileRoute } from "@tanstack/react-router";
import { MyEntriesPage } from "~/features/hiring/entries/pages/MyEntriesPage";

export const Route = createFileRoute("/_shell/_authed/my-entries/")({
	component: MyEntriesPage,
});
