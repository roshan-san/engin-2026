import { ChevronLeftIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PanelHeader } from "~/components/PanelHeader";
import { UnreadDot } from "~/components/UnreadDot";
import { Button } from "~/components/ui/button";

export type PanelProps = {
	/** Where Back goes: "Threads", "Thread". */
	readonly backLabel: string;
	/** Whether that place has messages you haven't read, shown on the way back. */
	readonly isBackUnread: boolean;
	/** Leaves the Card for the thread panel. */
	readonly onBack: () => void;
	/** On a phone, closes the sheet the panel sits in. */
	readonly onClose?: () => void;
};

/** Back to Threads on the left; the Card's menu and, on a phone, close on the right. */
export function CardHeader({
	backLabel,
	isBackUnread,
	onBack,
	onClose,
	children,
}: PanelProps & { readonly children?: ReactNode }) {
	return (
		<PanelHeader className="pl-2">
			<Button
				variant="ghost"
				size="sm"
				aria-label={`Back to ${backLabel}`}
				onClick={onBack}
			>
				<ChevronLeftIcon />
				{backLabel}
				{isBackUnread ? <UnreadDot /> : null}
			</Button>
			<div className="ml-auto flex items-center gap-1">
				{children}
				{onClose ? (
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Close"
						onClick={onClose}
					>
						<XIcon />
					</Button>
				) : null}
			</div>
		</PanelHeader>
	);
}
