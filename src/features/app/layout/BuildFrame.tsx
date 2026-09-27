import { PageLoading } from "~/components/globals/PageLoading";
import { useWorkspace } from "~/features/app/hooks/useWorkspace";
import { BuildNav } from "~/features/app/layout/BuildNav";
import { CycleGuest } from "~/features/work/cycles/components/CycleGuest";

export function BuildFrame({
	children,
}: {
	readonly children: React.ReactNode;
}) {
	const { active, isLoading } = useWorkspace();

	if (isLoading) {
		return (
			<div className="py-10">
				<PageLoading rows={4} />
			</div>
		);
	}

	if (!active) {
		return <CycleGuest />;
	}

	return (
		<div className="w-full space-y-8 py-8">
			<BuildNav />
			{children}
		</div>
	);
}
