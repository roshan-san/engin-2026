import { Page } from "~/components/shared/Page";
import { PageHeader } from "~/components/shared/PageHeader";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { ComponentGallery } from "~/features/design/components/ComponentGallery";
import { SamplePage } from "~/features/design/components/SamplePage";
import { TokenSwatches } from "~/features/design/components/TokenSwatches";

/** Dev-only gallery: the real component kit on the Zinc theme. */
export function DesignPage() {
	return (
		<>
			<PageHeader
				title="Design system"
				meta="Zinc. Everything below is the real component kit; check new work against it."
			/>
			<Page className="space-y-12">
				<section className="space-y-4">
					<SectionLabel>Sample screen</SectionLabel>
					<SamplePage />
				</section>
				<section className="space-y-4">
					<SectionLabel>Colours</SectionLabel>
					<TokenSwatches />
				</section>
				<section className="space-y-4">
					<SectionLabel>Components</SectionLabel>
					<ComponentGallery />
				</section>
			</Page>
		</>
	);
}
