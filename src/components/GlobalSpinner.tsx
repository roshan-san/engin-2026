import { cn } from "~/lib/utils";

/** `fill` takes the room left in a shell's page instead of a whole screen. */
export function GlobalSpinner({ fill = false }: { readonly fill?: boolean }) {
	return (
		<div
			className={cn(
				"flex animate-in fade-in delay-300 fill-mode-both items-center justify-center",
				fill ? "min-h-0 flex-1" : "min-h-dvh",
			)}
		>
			<div
				role="status"
				aria-label="Loading"
				className="size-10 animate-spin rounded-full border-2 border-muted border-t-foreground"
			/>
		</div>
	);
}
