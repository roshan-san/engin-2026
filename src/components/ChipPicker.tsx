import { type KeyboardEvent, useRef } from "react";
import { cn } from "~/lib/utils";

type ChipPickerProps<T extends string> = {
	readonly label: string;
	readonly options: readonly { value: T; label: string }[];
	readonly value: T | null;
	readonly onChange: (value: T) => void;
	/** Arrow keys pick as they move. Turn off where picking has a side effect. */
	readonly pickOnArrow?: boolean;
};

/** A radiogroup of pill buttons. Arrow keys move and pick; Space or Enter picks. */
export function ChipPicker<T extends string>({
	label,
	options,
	value,
	onChange,
	pickOnArrow = true,
}: ChipPickerProps<T>) {
	const refs = useRef<(HTMLButtonElement | null)[]>([]);
	const focusable = value ?? options[0]?.value;

	function moveTo(index: number) {
		const target = (index + options.length) % options.length;
		const next = options[target];
		if (!next) return;
		if (pickOnArrow) onChange(next.value);
		refs.current[target]?.focus();
	}

	function onKeyDown(event: KeyboardEvent, index: number) {
		if (event.key === "ArrowRight" || event.key === "ArrowDown") {
			event.preventDefault();
			moveTo(index + 1);
		} else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
			event.preventDefault();
			moveTo(index - 1);
		}
	}

	return (
		<div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
			{options.map((option, index) => {
				const checked = option.value === value;
				return (
					// biome-ignore lint/a11y/useSemanticElements: pill buttons styled as a radiogroup, per the design
					<button
						key={option.value}
						ref={(node) => {
							refs.current[index] = node;
						}}
						type="button"
						role="radio"
						aria-checked={checked}
						tabIndex={option.value === focusable ? 0 : -1}
						onClick={() => onChange(option.value)}
						onKeyDown={(event) => onKeyDown(event, index)}
						className={cn(
							"rounded-full border px-3 py-1 text-sm transition-colors focus-ring focus-visible:outline-hidden",
							checked
								? "border-foreground bg-foreground text-background"
								: "border-input hover:border-foreground/25 hover:bg-accent",
						)}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
