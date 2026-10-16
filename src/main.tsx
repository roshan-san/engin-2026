import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { GlobalNotFound } from "~/components/GlobalNotFound";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { routeTree } from "~/routeTree.gen";
import { MaintenanceGate } from "~/shell/MaintenanceGate";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "~/styles/globals.css";

const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	defaultPendingComponent: () => <GlobalSpinner fill />,
	defaultNotFoundComponent: GlobalNotFound,
	scrollRestoration: true,
	scrollToTopSelectors: ["[data-scroll-restoration-id=main]"],
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("app");

if (!rootElement) {
	throw new Error('Root element "#app" was not found in index.html');
}

ReactDOM.createRoot(rootElement).render(
	<StrictMode>
		<MaintenanceGate>
			<RouterProvider router={router} />
		</MaintenanceGate>
	</StrictMode>,
);
