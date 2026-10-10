import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { ChipPicker } from "~/components/shared/ChipPicker";
import { MentorNote } from "~/components/shared/MentorNote";
import { Button } from "~/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { useCreateStartup } from "./hooks/useCreateStartup";
import { CITIES, KINDS, STAGES } from "./startupChips";

type Choice<T extends readonly { value: string }[]> = T[number]["value"] | null;

export function NewStartupForm() {
	const navigate = useNavigate();
	const createStartup = useCreateStartup();
	const [name, setName] = useState("");
	const [stage, setStage] = useState<Choice<typeof STAGES>>(null);
	const [category, setCategory] = useState<Choice<typeof KINDS>>(null);
	const [city, setCity] = useState<Choice<typeof CITIES>>(null);
	const [isPending, setIsPending] = useState(false);

	const trimmed = name.trim();
	const ready = trimmed !== "" && stage && category && city;

	async function onSubmit(event: FormEvent) {
		event.preventDefault();
		if (!(trimmed && stage && category && city)) return;
		setIsPending(true);
		const slug = await createStartup({ name: trimmed, stage, category, city });
		setIsPending(false);
		if (slug) await navigate({ to: "/s/$slug/board", params: { slug } });
	}

	return (
		<form onSubmit={onSubmit}>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="startup-name">Name</FieldLabel>
					<Input
						id="startup-name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						maxLength={60}
						autoComplete="off"
					/>
				</Field>
				<Field>
					<FieldLabel>Stage</FieldLabel>
					<ChipPicker
						label="Stage"
						options={STAGES}
						value={stage}
						onChange={setStage}
					/>
					<MentorNote>Be honest. It sets your baseline.</MentorNote>
				</Field>
				<Field>
					<FieldLabel>Kind</FieldLabel>
					<ChipPicker
						label="Kind"
						options={KINDS}
						value={category}
						onChange={setCategory}
					/>
				</Field>
				<Field>
					<FieldLabel>City</FieldLabel>
					<ChipPicker
						label="City"
						options={CITIES}
						value={city}
						onChange={setCity}
					/>
				</Field>
				<Button type="submit" disabled={!ready || isPending}>
					Create startup
				</Button>
			</FieldGroup>
		</form>
	);
}
