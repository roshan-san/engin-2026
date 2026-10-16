import { type KeyboardEvent, type ReactNode, useRef } from "react";
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
	const refs = useRef<(HTMLButtonElement | null)[]>([]);

	// Radiogroup keys: arrows pick and focus the next choice, wrapping.
	function onKeyDown(event: KeyboardEvent, index: number) {
		const step =
			event.key === "ArrowRight" || event.key === "ArrowDown"
				? 1
				: event.key === "ArrowLeft" || event.key === "ArrowUp"
					? -1
					: 0;
		if (step === 0) return;
		event.preventDefault();
		const target = (index + step + options.length) % options.length;
		const next = options[target];
		if (!next) return;
		onChange(next.value);
		refs.current[target]?.focus();
	}

	return (
		<div
			role="radiogroup"
			aria-label={label}
			className={cn(
				"inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5",
				className,
			)}
		>
			{options.map((option, index) => (
				// biome-ignore lint/a11y/useSemanticElements: a segmented control styled as buttons
				<button
					key={option.value}
					ref={(node) => {
						refs.current[index] = node;
					}}
					type="button"
					role="radio"
					aria-checked={option.value === value}
					tabIndex={option.value === value ? 0 : -1}
					onClick={() => onChange(option.value)}
					onKeyDown={(event) => onKeyDown(event, index)}
					className={cn(
						"inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-ring",
						option.value === value && "bg-background text-foreground shadow-sm",
					)}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}
