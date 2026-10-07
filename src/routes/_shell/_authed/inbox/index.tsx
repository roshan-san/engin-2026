import { createFileRoute } from "@tanstack/react-router";
import { InboxPage } from "~/features/people/inbox/pages/InboxPage";

export const Route = createFileRoute("/_shell/_authed/inbox/")({
	component: InboxPage,
});
