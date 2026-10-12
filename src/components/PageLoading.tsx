import { useMemo } from "react";
import { Skeleton } from "~/components/ui/skeleton";

export function PageLoading({ rows = 1 }: { readonly rows?: number }) {
	// Stable across re-renders so React never remounts the skeleton rows.
	const keys = useMemo(
		() => Array.from({ length: rows }, () => crypto.randomUUID()),
		[rows],
	);

	return (
		<div className="flex flex-col gap-2">
			{keys.map((key) => (
				<Skeleton key={key} className="h-4 w-full" />
			))}
		</div>
	);
}
