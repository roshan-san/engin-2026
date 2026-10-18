import { TEXT } from "@convex/shared/limits";
import { useMatch, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { ChipPicker } from "~/components/ChipPicker";
import { DiscardChangesDialog } from "~/components/DiscardChangesDialog";
import { MentorNote } from "~/components/MentorNote";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
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
import { PlanSection } from "~/features/billing/PlanSection";
import { DISCIPLINE_OPTIONS } from "~/features/people/profile/profileText";
import { useDiscardGuard } from "~/lib/useDiscardGuard";
import { useMe } from "~/shell/useMe";
import {
	type ProfileDraft,
	type ProfileSource,
	renamedProfileTarget,
	toProfileArgs,
	toProfileDraft,
} from "./profileDraft";
import { usernameProblem } from "./usernameRule";
import { useUpdateProfile } from "./useUpdateProfile";

const USERNAME_MAX_LENGTH = 20;

/** Your profile: username, discipline, bio and links. One Save sends only what changed. */
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

	useEffect(() => {
		onChangedChange(isChanged);
		return () => onChangedChange(false);
	}, [isChanged, onChangedChange]);

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
						maxLength={USERNAME_MAX_LENGTH}
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
