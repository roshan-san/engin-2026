import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvex, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect } from "react";

export type PresenceView = FunctionReturnType<
	typeof api.chat.presence.list
>[number];

const HEARTBEAT_MS = 10_000;

/**
 * Who is online on the Startup. While mounted this tab heartbeats; it
 * disconnects on unmount and when the page hides. Presence is ambient, so
 * errors are swallowed and never toasted.
 */
export function usePresence(
	startupId: Id<"startups">,
): PresenceView[] | undefined {
	const online = useQuery(api.chat.presence.list, { startupId });
	const convex = useConvex();
	const heartbeat = useMutation(api.chat.presence.heartbeat);

	useEffect(() => {
		const sessionId = crypto.randomUUID();
		let sessionToken: string | null = null;
		let stopped = false;

		function disconnect() {
			const token = sessionToken;
			sessionToken = null;
			if (!token) return;
			convex
				.mutation(api.chat.presence.disconnect, { sessionToken: token })
				.catch(() => {
					// Best effort; the server drops the session after its deadline.
				});
		}

		function beat() {
			heartbeat({ startupId, sessionId, interval: HEARTBEAT_MS })
				.then((result) => {
					sessionToken = result.sessionToken;
					// Unmounted while the heartbeat was in flight.
					if (stopped) disconnect();
				})
				.catch(() => {
					// Ambient: the next beat tries again.
				});
		}

		beat();
		const timer = setInterval(beat, HEARTBEAT_MS);
		window.addEventListener("pagehide", disconnect);

		return () => {
			stopped = true;
			clearInterval(timer);
			window.removeEventListener("pagehide", disconnect);
			disconnect();
		};
	}, [convex, heartbeat, startupId]);

	return online;
}
