import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EmptyState } from "~/components/EmptyState";
import { Button } from "~/components/ui/button";

/** A page that isn't there. Pages pass their own `title`, `body` and `action` to say what's missing. */
export function GlobalNotFound({
	title = "This page doesn't exist",
	body,
	action,
}: {
	readonly title?: string;
	readonly body?: ReactNode;
	readonly action?: ReactNode;
} = {}) {
	return (
		<div className="flex flex-1 items-center justify-center">
			<EmptyState
				title={title}
				body={body}
				action={
					action ?? (
						<Button asChild>
							<Link to="/">Go home</Link>
						</Button>
					)
				}
			/>
		</div>
	);
}
