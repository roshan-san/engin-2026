import { TEXT } from "@convex/lib/limits";
import { type FormEvent, useRef, useState } from "react";
import { ChipPicker } from "~/components/shared/ChipPicker";
import { FormFooter } from "~/components/shared/FormFooter";
import { MentorNote } from "~/components/shared/MentorNote";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { initials } from "~/lib/initials";
import { CITIES, KINDS, STAGES } from "../startupChips";
import { useStartupSettings } from "./hooks/useStartupSettings";
import {
	type SettingsDraft,
	toSettingsDraft,
	toUpdateArgs,
} from "./settingsDraft";

/** The Founder's settings for the Startup. One Save sends only what changed; the logo saves on pick. */
export function StartupSettings() {
	const { startup } = useWorkspace();
	const { logoUrl, save, saveLogo } = useStartupSettings(
		startup._id,
		startup.slug,
	);
	const [draft, setDraft] = useState(() => toSettingsDraft(startup));
	const [isSaving, setIsSaving] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);
	const changes = toUpdateArgs(draft, startup);
	const isChanged = Object.keys(changes).length > 0;

	function set<K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) {
		setDraft((current) => ({ ...current, [key]: value }));
	}

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!isChanged || isSaving) return;
		setIsSaving(true);
		await save(changes);
		setIsSaving(false);
	}

	async function pickLogo(file: File | undefined) {
		if (!file) return;
		setIsUploading(true);
		await saveLogo(file);
		setIsUploading(false);
		if (fileInput.current) fileInput.current.value = "";
	}

	return (
		<form onSubmit={submit} className="flex flex-col gap-5">
			<SectionLabel>Startup settings</SectionLabel>

			<div className="flex items-center gap-3">
				<Avatar className="size-12 rounded-lg">
					{logoUrl ? <AvatarImage src={logoUrl} alt="" /> : null}
					<AvatarFallback className="rounded-lg">
						{initials(startup.name, null)}
					</AvatarFallback>
				</Avatar>
				<input
					ref={fileInput}
					type="file"
					accept="image/*"
					aria-label="Logo"
					className="sr-only"
					onChange={(event) => void pickLogo(event.target.files?.[0])}
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={isUploading}
					onClick={() => fileInput.current?.click()}
				>
					{isUploading ? <Spinner /> : null}
					{logoUrl ? "Change logo" : "Add logo"}
				</Button>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="startup-name">Name</Label>
				<Input
					id="startup-name"
					value={draft.name}
					maxLength={TEXT.startupName}
					onChange={(event) => set("name", event.target.value)}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="startup-one-liner">One line</Label>
				<Input
					id="startup-one-liner"
					value={draft.oneLiner}
					maxLength={TEXT.oneLiner}
					onChange={(event) => set("oneLiner", event.target.value)}
				/>
				<MentorNote>Who it's for. What changes for them.</MentorNote>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="startup-website">Website</Label>
				<Input
					id="startup-website"
					type="url"
					placeholder="https://"
					value={draft.website}
					onChange={(event) => set("website", event.target.value)}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">Stage</span>
				<ChipPicker
					label="Stage"
					options={STAGES}
					value={draft.stage}
					onChange={(stage) => set("stage", stage)}
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">Kind</span>
				<ChipPicker
					label="Kind"
					options={KINDS}
					value={draft.category}
					onChange={(category) => set("category", category)}
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">City</span>
				<ChipPicker
					label="City"
					options={CITIES}
					value={draft.city}
					onChange={(city) => set("city", city)}
				/>
			</div>

			<FormFooter>
				<Button type="submit" disabled={!isChanged || isSaving}>
					{isSaving ? <Spinner /> : null}
					Save
				</Button>
			</FormFooter>
		</form>
	);
}
