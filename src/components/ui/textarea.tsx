import type * as React from "react";

import { cn } from "~/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"flex field-sizing-content min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm outline-none transition-[color,border-color,box-shadow] placeholder:text-subtle-foreground hover:border-foreground/25 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/60 aria-invalid:border-destructive aria-invalid:ring-destructive/30",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
