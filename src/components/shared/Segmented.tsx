import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/** A small row of mutually exclusive choices: panel switches and sort toggles. */
export function Segmented<T extends string>({
	label,
	options,
	value,
	onChange,
	className,
}: {
	readonly label: string;
	readonly options: readonly { value: T; label: ReactNode }[];
	readonly value: T;
	readonly onChange: (value: T) => void;
	readonly className?: string;
}) {
	return (
		<div
			role="radiogroup"
			aria-label={label}
			className={cn(
				"inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5",
				className,
			)}
		>
			{options.map((option) => (
				// biome-ignore lint/a11y/useSemanticElements: a segmented control styled as buttons
				<button
					key={option.value}
					type="button"
					role="radio"
					aria-checked={option.value === value}
					onClick={() => onChange(option.value)}
					className={cn(
						"inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
						option.value === value && "bg-background text-foreground shadow-sm",
					)}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}
