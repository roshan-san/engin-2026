import { Skeleton } from "~/components/ui/skeleton";

/** Four placeholder rows while an Explore list loads; `rowClassName` sets their height. */
export function RowsSkeleton({
	rowClassName,
}: {
	readonly rowClassName: string;
}) {
	return (
		<div className="flex flex-col gap-3" aria-hidden>
			{[0, 1, 2, 3].map((n) => (
				<Skeleton key={n} className={rowClassName} />
			))}
		</div>
	);
}
