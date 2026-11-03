/** `20261109T043000Z`: the UTC form Google Calendar's dates take. */
function utcStamp(at: number): string {
	return new Date(at)
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(/\.\d{3}/, "");
}

/**
 * A Google Calendar link that opens a new weekly event, filled in: the Founder
 * saves it, Google adds a Meet link and sends the invites.
 */
export function calendarLink({
	title,
	startsAt,
	endsAt,
	day,
	guests,
	details,
}: {
	readonly title: string;
	readonly startsAt: number;
	readonly endsAt: number;
	readonly day: "MO" | "FR";
	readonly guests: readonly string[];
	readonly details: string;
}): string {
	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: title,
		dates: `${utcStamp(startsAt)}/${utcStamp(endsAt)}`,
		ctz: "Asia/Kolkata",
		recur: `RRULE:FREQ=WEEKLY;BYDAY=${day}`,
		add: guests.join(","),
		details,
	});
	return `https://calendar.google.com/calendar/render?${params}`;
}
