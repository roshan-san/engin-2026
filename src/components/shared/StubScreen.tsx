import { EmptyState } from "~/components/shared/EmptyState";

type StubScreenProps = {
	readonly title: string;
	readonly emptyTitle: string;
	readonly emptyDescription: string;
};

/** Bare empty-state stub used by every screen a later phase rebuilds (D-10). */
export function StubScreen({
	title,
	emptyTitle,
	emptyDescription,
}: StubScreenProps) {
	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<h1 className="text-xl font-semibold">{title}</h1>
			<EmptyState title={emptyTitle} description={emptyDescription} />
		</div>
	);
}
