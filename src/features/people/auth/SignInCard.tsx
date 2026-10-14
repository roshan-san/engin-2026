import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { GoogleButton } from "./GoogleButton";

/** Stands in for what only signed-in people see: one line saying what's behind it, and Sign in back to this page. */
export function SignInCard({ children }: { readonly children: ReactNode }) {
	const returnTo = useLocation({ select: (location) => location.href });

	return (
		<div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-8 text-center">
			<p className="text-sm text-muted-foreground">{children}</p>
			<GoogleButton variant="default" returnTo={returnTo} />
		</div>
	);
}
