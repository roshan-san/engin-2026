import { TEXT } from "@convex/shared/limits";
import { type FormEvent, useState } from "react";
import { ChipPicker } from "~/components/ChipPicker";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { DISCIPLINE_OPTIONS } from "~/features/people/profile/profileText";
import { useMe } from "~/shell/hooks/useMe";
import { useUpdateProfile } from "./hooks/useUpdateProfile";
import {
	type ProfileDraft,
	type ProfileSource,
	toProfileArgs,
	toProfileDraft,
} from "./profileDraft";

/** Your profile: username, discipline, bio and links. One Save sends only what changed. */
export function SettingsSheet({
	open,
	onOpenChange,
}: {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
}) {
	const me = useMe();

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Settings</SheetTitle>
					<SheetDescription>What people see on your profile.</SheetDescription>
				</SheetHeader>
				{me ? (
					<SettingsForm me={me} onSaved={() => onOpenChange(false)} />
				) : null}
			</SheetContent>
		</Sheet>
	);
}

function SettingsForm({
	me,
	onSaved,
}: {
	readonly me: ProfileSource;
	readonly onSaved: () => void;
}) {
	const { save } = useUpdateProfile();
	const [draft, setDraft] = useState(() => toProfileDraft(me));
	const [isSaving, setIsSaving] = useState(false);
	const changes = toProfileArgs(draft, me);
	const isChanged = Object.keys(changes).length > 0;

	function set<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
		setDraft((current) => ({ ...current, [key]: value }));
	}

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!isChanged || isSaving) return;
		setIsSaving(true);
		const saved = await save(changes);
		setIsSaving(false);
		if (saved) onSaved();
	}

	return (
		<form onSubmit={submit} className="flex flex-1 flex-col gap-5 px-4">
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="profile-username">Username</Label>
				<div className="flex items-center gap-1.5">
					<span aria-hidden className="text-muted-foreground">
						@
					</span>
					<Input
						id="profile-username"
						value={draft.username}
						autoCapitalize="none"
						autoComplete="off"
						spellCheck={false}
						onChange={(event) => set("username", event.target.value)}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<div className="flex h-6 items-center justify-between">
					<span className="text-sm font-medium">Discipline</span>
					{draft.discipline ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-6 px-2 text-xs"
							onClick={() => set("discipline", null)}
						>
							Clear
						</Button>
					) : null}
				</div>
				<ChipPicker
					label="Discipline"
					options={DISCIPLINE_OPTIONS}
					value={draft.discipline}
					onChange={(discipline) => set("discipline", discipline)}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="profile-bio">Bio</Label>
				<Textarea
					id="profile-bio"
					rows={4}
					value={draft.bio}
					maxLength={TEXT.bio}
					onChange={(event) => set("bio", event.target.value)}
				/>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="profile-linkedin">LinkedIn</Label>
				<Input
					id="profile-linkedin"
					type="url"
					placeholder="https://"
					value={draft.linkedinUrl}
					onChange={(event) => set("linkedinUrl", event.target.value)}
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="profile-github">GitHub</Label>
				<Input
					id="profile-github"
					type="url"
					placeholder="https://"
					value={draft.githubUrl}
					onChange={(event) => set("githubUrl", event.target.value)}
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="profile-portfolio">Portfolio</Label>
				<Input
					id="profile-portfolio"
					type="url"
					placeholder="https://"
					value={draft.portfolioUrl}
					onChange={(event) => set("portfolioUrl", event.target.value)}
				/>
			</div>

			<SheetFooter className="px-0">
				<Button type="submit" disabled={!isChanged || isSaving}>
					{isSaving ? <Spinner /> : null}
					Save
				</Button>
			</SheetFooter>
		</form>
	);
}
