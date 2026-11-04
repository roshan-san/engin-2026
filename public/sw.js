// engin's service worker: shows push notifications and opens their link when tapped.

self.addEventListener("push", (event) => {
	const data = event.data ? event.data.json() : {};
	event.waitUntil(
		self.registration.showNotification(data.title || "engin", {
			body: data.body || "",
			icon: "/web-app-manifest-192x192.png",
			badge: "/favicon-96x96.png",
			data: { url: data.url || "/home" },
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const url = event.notification.data?.url || "/home";
	event.waitUntil(
		self.clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((windows) => {
				for (const client of windows) {
					if ("focus" in client && "navigate" in client) {
						return client.focus().then(() => client.navigate(url));
					}
				}
				return self.clients.openWindow(url);
			}),
	);
});
