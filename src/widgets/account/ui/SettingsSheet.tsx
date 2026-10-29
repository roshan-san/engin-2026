import { TEXT } from "@convex/shared/limits";
import { usernameProblem } from "@convex/shared/username";
import { useMatch, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { DISCIPLINE_OPTIONS, useMe } from "~/entities/person";
import {
	type ProfileDraft,
	type ProfileSource,
	renamedProfileTarget,
	toProfileArgs,
	toProfileDraft,
	useUpdateProfile,
} from "~/features/edit-profile";
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
import { Separator } from "~/shared/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/shared/ui/sheet";
import { Spinner } from "~/shared/ui/spinner";
import { Textarea } from "~/shared/ui/textarea";
import { PlanSection } from "./PlanSection";

/** Your profile: username, discipline and bio. One Save sends only what changed. */
export function SettingsSheet({
	open,
	onOpenChange,
}: {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
}) {
	const me = useMe();
	const guard = useDiscardGuard(onOpenChange);

	return (
		<>
			<Sheet open={open} onOpenChange={guard.guardedOpenChange}>
				<SheetContent className="overflow-y-auto">
					<SheetHeader>
						<SheetTitle>Settings</SheetTitle>
						<SheetDescription>
							What people see on your profile.
						</SheetDescription>
					</SheetHeader>
					{me ? (
						<>
							<PlanSection />
							<Separator className="mx-4 w-auto" />
							<SettingsForm
								me={me}
								onChangedChange={guard.setIsChanged}
								onSaved={() => onOpenChange(false)}
							/>
						</>
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

function SettingsForm({
	me,
	onChangedChange,
	onSaved,
}: {
	readonly me: ProfileSource;
	readonly onChangedChange: (isChanged: boolean) => void;
	readonly onSaved: () => void;
}) {
	const { save } = useUpdateProfile();
	const navigate = useNavigate();
	const profilePage = useMatch({
		from: "/_shell/u/$username",
		shouldThrow: false,
	});
	const [draft, setDraft] = useState(() => toProfileDraft(me));
	const [isSaving, setIsSaving] = useState(false);
	const changes = toProfileArgs(draft, me);
	const isChanged = Object.keys(changes).length > 0;
	const usernameError =
		changes.username === undefined ? null : usernameProblem(changes.username);

	useReportChanged(isChanged, onChangedChange);

	function set<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
		setDraft((current) => ({ ...current, [key]: value }));
	}

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!isChanged || isSaving || usernameError) return;
		setIsSaving(true);
		const saved = await save(changes);
		setIsSaving(false);
		if (!saved) return;
		const renamedTo = renamedProfileTarget(
			{
				pageUsername: profilePage?.params.username,
				savedUsername: me.username,
			},
			changes.username,
		);
		if (renamedTo) {
			void navigate({
				to: "/u/$username",
				params: { username: renamedTo },
				replace: true,
			});
		}
		onSaved();
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
						maxLength={TEXT.username}
						autoCapitalize="none"
						autoComplete="off"
						spellCheck={false}
						aria-invalid={usernameError !== null}
						aria-describedby="profile-username-note"
						onChange={(event) => set("username", event.target.value)}
					/>
				</div>
				<div id="profile-username-note" className="flex flex-col gap-1">
					{usernameError ? (
						<p role="alert" className="text-xs text-destructive">
							{usernameError}
						</p>
					) : null}
					<MentorNote>
						3–20 characters: letters, numbers and _, starting with a letter.
						Your profile link changes too.
					</MentorNote>
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

			<SheetFooter className="px-0">
				<Button
					type="submit"
					disabled={!isChanged || isSaving || usernameError !== null}
				>
					{isSaving ? <Spinner /> : null}
					Save
				</Button>
			</SheetFooter>
		</form>
	);
}
