import type { Doc } from "@convex/_generated/dataModel";
import { TEXT } from "@convex/shared/limits";
import { type FormEvent, useRef, useState } from "react";
import { CITIES, KINDS, STAGES, useStartup } from "~/entities/startup";
import {
	useDiscardGuard,
	useReportChanged,
} from "~/shared/lib/useDiscardGuard";
import { Button } from "~/shared/ui/button";
import { ChipPicker } from "~/shared/ui/ChipPicker";
import { DiscardChangesDialog } from "~/shared/ui/DiscardChangesDialog";
import { Input } from "~/shared/ui/input";
import { Label } from "~/shared/ui/label";
import { MentorNote } from "~/shared/ui/MentorNote";
import { PlaceLogo } from "~/shared/ui/PlaceLogo";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/shared/ui/sheet";
import { Spinner } from "~/shared/ui/spinner";
import { useStartupSettings } from "../api/useStartupSettings";
import {
	type SettingsDraft,
	toSettingsDraft,
	toUpdateArgs,
} from "../model/settingsDraft";

/** The Founder's Startup settings, in a side sheet over whichever tab is open. */
export function StartupSettingsSheet({
	slug,
	open,
	onOpenChange,
}: {
	readonly slug: string;
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
}) {
	const found = useStartup(open ? slug : undefined);
	const guard = useDiscardGuard(onOpenChange);

	return (
		<>
			<Sheet open={open} onOpenChange={guard.guardedOpenChange}>
				<SheetContent className="overflow-y-auto">
					<SheetHeader>
						<SheetTitle>Startup settings</SheetTitle>
						<SheetDescription>
							What people see on your Startup's page.
						</SheetDescription>
					</SheetHeader>
					{found === undefined ? (
						<div className="flex justify-center py-6">
							<Spinner />
						</div>
					) : found?.role === "founder" ? (
						<StartupSettings
							startup={found.startup}
							onChangedChange={guard.setIsChanged}
							onSaved={() => onOpenChange(false)}
						/>
					) : null}
				</SheetContent>
			</Sheet>
			<DiscardChangesDialog
				open={guard.isAsking}
				onKeepEditing={guard.keepEditing}
				onDiscard={guard.discard}
			/>
		</>
	);
}

/** One Save sends only what changed; the logo saves on pick. */
function StartupSettings({
	startup,
	onChangedChange,
	onSaved,
}: {
	readonly startup: Doc<"startups">;
	readonly onChangedChange: (isChanged: boolean) => void;
	readonly onSaved: () => void;
}) {
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
	const isNameBlank = draft.name.trim() === "";

	useReportChanged(isChanged, onChangedChange);

	function set<K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) {
		setDraft((current) => ({ ...current, [key]: value }));
	}

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!isChanged || isSaving || isNameBlank) return;
		setIsSaving(true);
		const saved = await save(changes);
		setIsSaving(false);
		if (saved) onSaved();
	}

	async function pickLogo(file: File | undefined) {
		if (!file) return;
		setIsUploading(true);
		await saveLogo(file);
		setIsUploading(false);
		if (fileInput.current) fileInput.current.value = "";
	}

	return (
		<form onSubmit={submit} className="flex flex-1 flex-col gap-5 px-4">
			<div className="flex items-center gap-3">
				<PlaceLogo name={startup.name} url={logoUrl ?? null} size={40} />
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

			<SheetFooter className="px-0">
				<Button type="submit" disabled={!isChanged || isSaving || isNameBlank}>
					{isSaving ? <Spinner /> : null}
					Save
				</Button>
			</SheetFooter>
		</form>
	);
}
