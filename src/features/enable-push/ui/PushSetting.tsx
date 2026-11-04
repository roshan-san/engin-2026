import { Button } from "~/shared/ui/button";
import { Label } from "~/shared/ui/label";
import { MentorNote } from "~/shared/ui/MentorNote";
import { type PushState, usePush } from "../api/usePush";

const NOTES: Record<PushState, string> = {
	loading: "",
	unsupported:
		"This browser can't show notifications. On iPhone, add engin to your Home Screen first.",
	unavailable: "Notifications aren't set up on engin yet.",
	blocked:
		"Notifications are blocked for engin. Allow them in your browser's site settings.",
	off: "Get the same updates as email on this device: Offers, decisions, Cards sent back and reminders.",
	on: "This device gets notifications. Other devices are set separately.",
};

/** Notifications on this device: on, off, or why they can't be. */
export function PushSetting() {
	const { state, turnOn, turnOff } = usePush();

	return (
		<section className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-3">
				<Label>Notifications on this device</Label>
				{state === "on" ? (
					<Button variant="outline" size="sm" onClick={() => void turnOff()}>
						Turn off
					</Button>
				) : state === "off" ? (
					<Button size="sm" onClick={() => void turnOn()}>
						Turn on
					</Button>
				) : null}
			</div>
			{NOTES[state] ? <MentorNote>{NOTES[state]}</MentorNote> : null}
		</section>
	);
}
