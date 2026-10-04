import { MAX_TRIAL_CHALLENGES } from "@convex/lib/limits";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { FieldDescription, FieldLegend, FieldSet } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

export type StartingPulseDraft = {
	/** Client-only key so React keeps each row's inputs stable. */
	readonly key: string;
	readonly title: string;
	readonly description: string;
};

export function newStartingPulse(
	title: string,
	description = "",
): StartingPulseDraft {
	return { key: crypto.randomUUID(), title, description };
}

type StartingPulsesFieldProps = {
	readonly value: readonly StartingPulseDraft[];
	readonly onChange: (value: StartingPulseDraft[]) => void;
	readonly disabled?: boolean;
};

/** The Pulses every participant's board starts with, mirroring the Cycle pulse-add UI. */
export function StartingPulsesField({
	value,
	onChange,
	disabled,
}: StartingPulsesFieldProps) {
	const [title, setTitle] = useState("");
	const isFull = value.length >= MAX_TRIAL_CHALLENGES;

	function add() {
		if (!title.trim() || isFull) {
			return;
		}
		onChange([...value, newStartingPulse(title.trim())]);
		setTitle("");
	}

	function update(key: string, patch: Partial<StartingPulseDraft>) {
		onChange(
			value.map((pulse) =>
				pulse.key === key ? { ...pulse, ...patch } : pulse,
			),
		);
	}

	return (
		<FieldSet>
			<FieldLegend>Starting Pulses</FieldLegend>
			<FieldDescription>
				Each participant starts with these on their board. Up to{" "}
				{MAX_TRIAL_CHALLENGES}.
			</FieldDescription>

			{value.length > 0 ? (
				<ol className="flex flex-col gap-3">
					{value.map((pulse, index) => (
						<li
							key={pulse.key}
							className="flex flex-col gap-2 rounded-lg border p-3"
						>
							<div className="flex items-center gap-2">
								<span className="w-5 shrink-0 text-sm text-muted-foreground">
									{index + 1}.
								</span>
								<Input
									aria-label={`Starting Pulse ${index + 1} title`}
									value={pulse.title}
									disabled={disabled}
									onChange={(event) =>
										update(pulse.key, { title: event.target.value })
									}
									className="h-11 flex-1"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label={`Remove Starting Pulse ${index + 1}`}
									disabled={disabled}
									onClick={() =>
										onChange(value.filter((item) => item.key !== pulse.key))
									}
								>
									<X />
								</Button>
							</div>
							<Textarea
								aria-label={`Starting Pulse ${index + 1} description`}
								placeholder="Description (optional)"
								value={pulse.description}
								disabled={disabled}
								onChange={(event) =>
									update(pulse.key, { description: event.target.value })
								}
								rows={2}
							/>
						</li>
					))}
				</ol>
			) : null}

			<div className="flex flex-col gap-2 sm:flex-row">
				<Input
					aria-label="New Starting Pulse title"
					value={title}
					disabled={disabled || isFull}
					onChange={(event) => setTitle(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							add();
						}
					}}
					placeholder={
						isFull ? "Starting Pulse limit reached" : "Add a Starting Pulse"
					}
					className="h-11 flex-1"
				/>
				<Button
					type="button"
					variant="outline"
					disabled={disabled || isFull || !title.trim()}
					onClick={add}
					className="h-11"
				>
					Add Pulse
				</Button>
			</div>
		</FieldSet>
	);
}
