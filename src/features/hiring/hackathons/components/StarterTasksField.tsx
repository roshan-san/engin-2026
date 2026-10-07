import { MAX_STARTER_TASKS } from "@convex/lib/limits";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { FieldDescription, FieldLegend, FieldSet } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

export type StarterTaskDraft = {
	/** Client-only key so React keeps each row's inputs stable. */
	readonly key: string;
	readonly title: string;
	readonly description: string;
};

export function newStarterTask(
	title: string,
	description = "",
): StarterTaskDraft {
	return { key: crypto.randomUUID(), title, description };
}

type StarterTasksFieldProps = {
	readonly value: readonly StarterTaskDraft[];
	readonly onChange: (value: StarterTaskDraft[]) => void;
	readonly disabled?: boolean;
};

/** The Tasks every participant's board starts with, mirroring the Cycle task-add UI. */
export function StarterTasksField({
	value,
	onChange,
	disabled,
}: StarterTasksFieldProps) {
	const [title, setTitle] = useState("");
	const isFull = value.length >= MAX_STARTER_TASKS;

	function add() {
		if (!title.trim() || isFull) {
			return;
		}
		onChange([...value, newStarterTask(title.trim())]);
		setTitle("");
	}

	function update(key: string, patch: Partial<StarterTaskDraft>) {
		onChange(
			value.map((task) => (task.key === key ? { ...task, ...patch } : task)),
		);
	}

	return (
		<FieldSet>
			<FieldLegend>Starter Tasks</FieldLegend>
			<FieldDescription>
				Each Participant starts with these on their Board. Up to{" "}
				{MAX_STARTER_TASKS}.
			</FieldDescription>

			{value.length > 0 ? (
				<ol className="flex flex-col gap-3">
					{value.map((task, index) => (
						<li
							key={task.key}
							className="flex flex-col gap-2 rounded-lg border p-3"
						>
							<div className="flex items-center gap-2">
								<span className="w-5 shrink-0 text-sm text-muted-foreground">
									{index + 1}.
								</span>
								<Input
									aria-label={`Starter Task ${index + 1} title`}
									value={task.title}
									disabled={disabled}
									onChange={(event) =>
										update(task.key, { title: event.target.value })
									}
									className="h-11 flex-1"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label={`Remove Starter Task ${index + 1}`}
									disabled={disabled}
									onClick={() =>
										onChange(value.filter((item) => item.key !== task.key))
									}
								>
									<X />
								</Button>
							</div>
							<Textarea
								aria-label={`Starter Task ${index + 1} description`}
								placeholder="Description (optional)"
								value={task.description}
								disabled={disabled}
								onChange={(event) =>
									update(task.key, { description: event.target.value })
								}
								rows={2}
							/>
						</li>
					))}
				</ol>
			) : null}

			<div className="flex flex-col gap-2 sm:flex-row">
				<Input
					aria-label="New Starter Task title"
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
						isFull ? "Starter Task limit reached" : "Add a Starter Task"
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
					Add Starter Task
				</Button>
			</div>
		</FieldSet>
	);
}
