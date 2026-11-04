import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { attempt } from "~/shared/lib/errors";
import { vapidKeyBytes } from "../lib/vapidKey";

export type PushState =
	| "unsupported"
	| "unavailable"
	| "blocked"
	| "off"
	| "on"
	| "loading";

function isSupported(): boolean {
	return (
		typeof window !== "undefined" &&
		"serviceWorker" in navigator &&
		"PushManager" in window &&
		"Notification" in window
	);
}

/** This browser's push: where it stands, and turning it on or off. */
export function usePush() {
	const publicKey = useQuery(api.push.publicKey, {});
	const subscribe = useMutation(api.push.subscribe);
	const unsubscribe = useMutation(api.push.unsubscribe);
	const [endpoint, setEndpoint] = useState<string | null | undefined>(
		undefined,
	);
	const isStored = useQuery(
		api.push.isSubscribed,
		endpoint ? { endpoint } : "skip",
	);

	useEffect(() => {
		if (!isSupported()) {
			setEndpoint(null);
			return;
		}
		void navigator.serviceWorker
			.getRegistration()
			.then((registration) => registration?.pushManager.getSubscription())
			.then((subscription) => setEndpoint(subscription?.endpoint ?? null));
	}, []);

	let state: PushState;
	if (!isSupported()) state = "unsupported";
	else if (publicKey === undefined || endpoint === undefined) state = "loading";
	else if (publicKey === null) state = "unavailable";
	else if (Notification.permission === "denied") state = "blocked";
	else state = endpoint && isStored ? "on" : "off";

	async function turnOn() {
		if (!publicKey) return false;
		return await attempt(async () => {
			const permission = await Notification.requestPermission();
			if (permission !== "granted") {
				throw new Error("Notifications are blocked in this browser");
			}
			const registration = await navigator.serviceWorker.register("/sw.js");
			await navigator.serviceWorker.ready;
			const subscription =
				(await registration.pushManager.getSubscription()) ??
				(await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: vapidKeyBytes(publicKey),
				}));
			const json = subscription.toJSON();
			if (!json.keys?.p256dh || !json.keys.auth) {
				throw new Error("This browser didn't give a push key");
			}
			await subscribe({
				endpoint: subscription.endpoint,
				keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
			});
			setEndpoint(subscription.endpoint);
		});
	}

	async function turnOff() {
		return await attempt(async () => {
			const registration = await navigator.serviceWorker.getRegistration();
			const subscription = await registration?.pushManager.getSubscription();
			if (subscription) {
				await unsubscribe({ endpoint: subscription.endpoint });
				await subscription.unsubscribe();
			}
			setEndpoint(null);
		});
	}

	return { state, turnOn, turnOff };
}
