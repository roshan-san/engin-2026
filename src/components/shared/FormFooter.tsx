import type { ReactNode } from "react";

type FormFooterProps = {
	readonly children: ReactNode;
};

/** Form actions: pinned to the bottom on phone, right-aligned inline on desktop. */
export function FormFooter({ children }: FormFooterProps) {
	return (
		<div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t bg-background px-4 py-3 md:static md:mx-0 md:justify-end md:border-t-0 md:px-0 md:py-0">
			{children}
		</div>
	);
}
