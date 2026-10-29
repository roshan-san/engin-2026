import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { TILE } from "~/components/tile";
import { cn } from "~/shared/lib/cn";
import { GoogleButton } from "./GoogleButton";

/** Stands in for what only signed-in people see: one line saying what's behind it, and Sign in back to this page. */
export function SignInCard({ children }: { readonly children: ReactNode }) {
	const returnTo = useLocation({ select: (location) => location.href });

	return (
		<div
			className={cn(
				TILE,
				"flex flex-col items-center gap-4 px-6 py-8 text-center",
			)}
		>
			<p className="text-sm text-muted-foreground">{children}</p>
			<GoogleButton variant="default" returnTo={returnTo} />
		</div>
	);
}
