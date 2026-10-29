import type * as React from "react";

import { cn } from "~/shared/lib/cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"flex field-sizing-content min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm transition-[color,border-color,box-shadow] placeholder:text-subtle-foreground hover:border-foreground/25 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-foreground/40 aria-invalid:border-destructive focus-ring aria-invalid:ring-destructive/30",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
