import { createFileRoute } from "@tanstack/react-router";
import { MessagesPage } from "~/features/messages/ui/MessagesPage";

export const Route = createFileRoute("/app/messages/")({
	component: MessagesPage,
});
