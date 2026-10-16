import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
	"inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium transition-colors focus-ring [&>svg]:pointer-events-none [&>svg]:size-3",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/85",
				secondary:
					"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
				destructive:
					"border-transparent bg-destructive/15 text-destructive [a&]:hover:bg-destructive/25",
				outline:
					"border-input text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
				status:
					"border-input bg-transparent text-foreground before:size-1.5 before:shrink-0 before:rounded-full before:bg-(--badge-dot)",
			},
			tone: {
				neutral: "[--badge-dot:var(--muted-foreground)]",
				success: "[--badge-dot:var(--success)]",
				warning: "[--badge-dot:var(--warning)]",
				destructive: "[--badge-dot:var(--destructive)]",
				link: "[--badge-dot:var(--link)]",
			},
		},
		defaultVariants: {
			variant: "default",
			tone: "neutral",
		},
	},
);

function Badge({
	className,
	variant,
	tone,
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : "span";

	return (
		<Comp
			data-slot="badge"
			className={cn(badgeVariants({ variant, tone }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
