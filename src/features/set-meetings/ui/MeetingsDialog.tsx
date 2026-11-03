import { DEFAULT_SLOTS, type MeetingSlot } from "@convex/cycles/rules";
import { useState } from "react";
import { useCycle } from "~/entities/cycle";
import { useWorkspace } from "~/entities/startup";
import { Button } from "~/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/shared/ui/dialog";
import { Input } from "~/shared/ui/input";
import { Label } from "~/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/shared/ui/select";
import { useMarkInvited } from "../api/useMarkInvited";
import { useSetMeetings } from "../api/useSetMeetings";
import { calendarLink } from "../model/calendarLink";
import { LENGTHS, START_TIMES, timeLabel } from "../model/slotOptions";

type Kind = "opening" | "closing";

const KINDS: readonly {
	kind: Kind;
	title: string;
	day: "MO" | "FR";
	dayName: string;
}[] = [
	{ kind: "opening", title: "Opening", day: "MO", dayName: "Monday" },
	{ kind: "closing", title: "Closing", day: "FR", dayName: "Friday" },
];

/** The Founder sets the two weekly meetings, then creates each in Google Calendar. */
export function MeetingsDialog({
	open,
	onOpenChange,
}: {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Weekly meetings</DialogTitle>
					<DialogDescription>
						Plan the week on Monday, close it on Friday. The Board is locked
						between them.
					</DialogDescription>
				</DialogHeader>
				{/* Remounted on each open, so the form starts from what's saved. */}
				{open ? <MeetingsForm /> : null}
			</DialogContent>
		</Dialog>
	);
}

function MeetingsForm() {
	const { startup } = useWorkspace();
	const cycle = useCycle(startup._id);
	const save = useSetMeetings(startup._id);
	const markInvited = useMarkInvited(startup._id);
	const saved = cycle?.meetings ?? null;
	const [slots, setSlots] = useState<Record<Kind, MeetingSlot>>(() => ({
		opening: saved?.opening ?? DEFAULT_SLOTS.opening,
		closing: saved?.closing ?? DEFAULT_SLOTS.closing,
	}));
	const [links, setLinks] = useState<Record<Kind, string>>(() => ({
		opening: saved?.openingLink ?? "",
		closing: saved?.closingLink ?? "",
	}));
	const [isSaving, setIsSaving] = useState(false);

	const isDirty =
		saved === null ||
		KINDS.some(
			({ kind }) =>
				slots[kind].startMinutes !== saved[kind].startMinutes ||
				slots[kind].minutes !== saved[kind].minutes ||
				links[kind].trim() !== (saved[`${kind}Link`] ?? ""),
		);

	function setSlot(kind: Kind, patch: Partial<MeetingSlot>) {
		setSlots((current) => ({
			...current,
			[kind]: { ...current[kind], ...patch },
		}));
	}

	async function onSave() {
		setIsSaving(true);
		await save({
			opening: slots.opening,
			closing: slots.closing,
			openingLink: links.opening,
			closingLink: links.closing,
		});
		setIsSaving(false);
	}

	const next = { opening: cycle?.nextOpening, closing: cycle?.nextClosing };
	const details = `${window.location.origin}/s/${startup.slug}/cycle`;

	return (
		<>
			<div className="flex flex-col gap-5">
				{KINDS.map(({ kind, title, day, dayName }) => {
					const when = next[kind];
					return (
						<fieldset key={kind} className="flex flex-col gap-2">
							<legend className="mb-2 text-sm font-medium">
								{title} meeting · {dayName}
							</legend>
							<div className="flex gap-2">
								<Select
									value={String(slots[kind].startMinutes)}
									onValueChange={(value) =>
										setSlot(kind, { startMinutes: Number(value) })
									}
								>
									<SelectTrigger aria-label={`${title} start time`}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{START_TIMES.map((minutes) => (
											<SelectItem key={minutes} value={String(minutes)}>
												{timeLabel(minutes)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select
									value={String(slots[kind].minutes)}
									onValueChange={(value) =>
										setSlot(kind, { minutes: Number(value) })
									}
								>
									<SelectTrigger aria-label={`${title} length`}>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{LENGTHS.map((minutes) => (
											<SelectItem key={minutes} value={String(minutes)}>
												{minutes} min
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Label htmlFor={`meeting-link-${kind}`} className="sr-only">
								{title} meeting link
							</Label>
							<Input
								id={`meeting-link-${kind}`}
								type="url"
								placeholder="Meeting link (optional)"
								value={links[kind]}
								onChange={(event) =>
									setLinks((current) => ({
										...current,
										[kind]: event.target.value,
									}))
								}
							/>
							{!isDirty && when && cycle?.guests ? (
								<a
									className="text-sm text-primary underline underline-offset-4"
									href={calendarLink({
										title: `engin · ${title} · ${startup.name}`,
										startsAt: when.startsAt,
										endsAt: when.endsAt,
										day,
										guests: cycle.guests,
										details,
									})}
									target="_blank"
									rel="noreferrer"
									onClick={() => void markInvited()}
								>
									Create {title.toLowerCase()} meeting
								</a>
							) : null}
						</fieldset>
					);
				})}
				<p className="text-sm text-muted-foreground">
					{isDirty
						? "Save, then create each meeting in Google Calendar."
						: "Change times here, then create the meeting again and delete the old one in Google Calendar."}
				</p>
			</div>
			<DialogFooter>
				<Button onClick={() => void onSave()} disabled={!isDirty || isSaving}>
					Save
				</Button>
			</DialogFooter>
		</>
	);
}
