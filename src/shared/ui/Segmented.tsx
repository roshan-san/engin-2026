import { RadioGroup } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "~/shared/lib/cn";

/** A small row of mutually exclusive choices: panel switches and sort toggles. Arrow keys pick. */
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
		<RadioGroup.Root
			aria-label={label}
			value={value}
			onValueChange={(next) => onChange(next as T)}
			className={cn(
				"inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5",
				className,
			)}
		>
			{options.map((option) => (
				<RadioGroup.Item
					key={option.value}
					value={option.value}
					className={cn(
						"inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-ring",
						option.value === value && "bg-background text-foreground shadow-sm",
					)}
				>
					{option.label}
				</RadioGroup.Item>
			))}
		</RadioGroup.Root>
	);
}
