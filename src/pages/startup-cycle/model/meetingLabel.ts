import type { MeetingSlot } from "@convex/cycles/rules";
import { timeLabel } from "~/features/set-meetings";

/** "Opening · Mon 10:00 IST". */
export function meetingLabel(
	name: "Opening" | "Closing",
	slot: MeetingSlot,
	day: "Mon" | "Fri",
): string {
	return `${name} · ${day} ${timeLabel(slot.startMinutes)} IST`;
}
