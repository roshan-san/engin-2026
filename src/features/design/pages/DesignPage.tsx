import { Page } from "~/components/shared/Page";
import { PageHeader } from "~/components/shared/PageHeader";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { ComponentGallery } from "~/features/design/components/ComponentGallery";
import { SamplePage } from "~/features/design/components/SamplePage";
import { SystemSwitch } from "~/features/design/components/SystemSwitch";
import { TokenSwatches } from "~/features/design/components/TokenSwatches";
import { useDesignSystem } from "~/features/design/hooks/useDesignSystem";
import type { DesignSystem } from "~/features/design/systems";

/** Dev-only picker: the real components under each candidate system. */
export function DesignPage({ system }: { readonly system: DesignSystem }) {
	useDesignSystem(system);

	return (
		<>
			<PageHeader
				title="Design systems"
				meta="Switch systems to compare. Everything below is the real component kit."
				actions={<SystemSwitch current={system} />}
			/>
			<Page className="space-y-12">
				<section className="space-y-4">
					<SectionLabel>Sample screen</SectionLabel>
					<SamplePage />
				</section>
				<section className="space-y-4">
					<SectionLabel>Colours</SectionLabel>
					<TokenSwatches system={system} />
				</section>
				<section className="space-y-4">
					<SectionLabel>Components</SectionLabel>
					<ComponentGallery />
				</section>
			</Page>
		</>
	);
}
