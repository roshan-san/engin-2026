/// <reference types="vite/client" />
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { AppProviders } from "~/features/auth/providers/AppProviders";
import { Toaster } from "~/components/ui/sonner";
import appCss from "~/styles/globals.css?url";

function headTags() {
	return {
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Engin - The Fast Lane For Founders",
			},
			{
				name: "description",
				content:
					"Engin helps founders build startups, manage teams, publish pitch decks, and hire through hiring sprints.",
			},
			{
				name: "apple-mobile-web-app-title",
				content: "Engin",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
			{ rel: "manifest", href: "/site.webmanifest" },
		],
	};
}
function RootComponent() {
	return (
		<AppProviders>
			<RootDocument>
				<Outlet />
			</RootDocument>
		</AppProviders>
	);
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Toaster richColors />
				<Scripts />
			</body>
		</html>
	);
}
export const Route = createRootRoute({
	head: headTags,
	component: RootComponent,
	pendingComponent: GlobalSpinner,
});
