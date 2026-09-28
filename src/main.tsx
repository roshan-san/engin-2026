import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { GlobalNotFound } from "~/components/globals/GlobalNotFound";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { routeTree } from "~/routeTree.gen";
import "@fontsource-variable/geist";
import "~/styles/globals.css";

const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	defaultPendingComponent: GlobalSpinner,
	defaultNotFoundComponent: GlobalNotFound,
	scrollRestoration: true,
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
