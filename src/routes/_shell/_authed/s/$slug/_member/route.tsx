import { createFileRoute } from "@tanstack/react-router";
import { MemberGate } from "~/shell/startup/MemberGate";

export const Route = createFileRoute("/_shell/_authed/s/$slug/_member")({
	component: MemberGate,
});
