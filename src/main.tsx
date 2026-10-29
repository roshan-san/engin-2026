import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "~/routeTree.gen";
import { GlobalNotFound } from "~/shared/ui/GlobalNotFound";
import { GlobalSpinner } from "~/shared/ui/GlobalSpinner";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "~/styles/globals.css";

const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	defaultPendingComponent: () => <GlobalSpinner fill />,
	defaultNotFoundComponent: () => <GlobalNotFound />,
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
		<RouterProvider router={router} />
	</StrictMode>,
);
