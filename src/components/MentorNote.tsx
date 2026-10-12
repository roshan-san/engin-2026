import type { ReactNode } from "react";

/** One muted line of guidance under a field. */
export function MentorNote({ children }: { readonly children: ReactNode }) {
	return <p className="text-xs text-muted-foreground">{children}</p>;
}
