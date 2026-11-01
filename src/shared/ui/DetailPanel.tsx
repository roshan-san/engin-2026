import type { ReactNode } from "react";
import type { PanelShows } from "./detailPanelState";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "./sheet";

/** Everything that opens on the side: 380px on the right on desktop, a full-screen sheet on a phone. */
export function DetailPanel({
	shows,
	item,
	fallback,
	title,
	description,
	onClose,
	hasCloseButton = false,
}: {
	readonly shows: PanelShows;
	/** The open item (a Card, an entry). */
	readonly item: ReactNode;
	/** The page's own panel when no item is open. */
	readonly fallback: ReactNode;
	/** For screen readers, naming the sheet. */
	readonly title: string;
	readonly description: string;
	readonly onClose: () => void;
	/** For panels without their own close button: the sheet adds one. */
	readonly hasCloseButton?: boolean;
}) {
	const content = shows?.what === "item" ? item : fallback;

	return (
		<>
			<aside className="hidden w-[380px] shrink-0 flex-col border-l border-border md:flex">
				{shows?.where === "side" ? content : null}
			</aside>
			<Sheet
				open={shows?.where === "sheet"}
				onOpenChange={(isOpen) => {
					if (!isOpen) onClose();
				}}
			>
				<SheetContent
					side="bottom"
					className="h-dvh gap-0"
					showCloseButton={hasCloseButton}
				>
					<SheetHeader className="sr-only">
						<SheetTitle>{title}</SheetTitle>
						<SheetDescription>{description}</SheetDescription>
					</SheetHeader>
					{shows?.where === "sheet" ? content : null}
				</SheetContent>
			</Sheet>
		</>
	);
}
