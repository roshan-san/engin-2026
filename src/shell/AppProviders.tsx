import { ConvexAuthProvider } from "@convex-dev/auth/react";
import type { ReactNode } from "react";
import { convex } from "~/lib/convex";

export function AppProviders({ children }: { readonly children: ReactNode }) {
	return (
		<ConvexAuthProvider
			client={convex}
			replaceURL={(relativeUrl) => {
				window.history.replaceState({}, "", relativeUrl);
			}}
		>
			{children}
		</ConvexAuthProvider>
	);
}
