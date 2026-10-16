import type * as React from "react";

import { cn } from "~/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm shadow-none outline-none transition-[color,border-color,box-shadow] selection:bg-link/30 placeholder:text-subtle-foreground hover:border-foreground/25 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"focus-visible:border-foreground/40 focus-ring",
				"aria-invalid:border-destructive aria-invalid:ring-destructive/30",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
