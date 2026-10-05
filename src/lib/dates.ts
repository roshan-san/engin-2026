const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function fromDateInput(value: string): number {
	return new Date(`${value}T00:00:00.000Z`).getTime();
}

export function toDateInput(value: number): string {
	return new Date(value).toISOString().slice(0, 10);
}

/** A `datetime-local` value ("2026-10-05T10:00") read as the viewer's local time. */
export function fromDateTimeInput(value: string): number {
	const [date = "", time = "00:00"] = value.split("T");
	const [year, month, day] = date.split("-").map(Number);
	const [hours, minutes] = time.split(":").map(Number);
	return new Date(year, month - 1, day, hours, minutes).getTime();
}

/** The `datetime-local` value for a timestamp, in the viewer's local time. */
export function toDateTimeInput(value: number): string {
	const date = new Date(value);
	const pad = (part: number) => String(part).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDate(value: number): string {
	return new Date(value).toLocaleDateString();
}

export function formatDateRange(startAt: number, endAt: number): string {
	const start = new Date(startAt);
	const end = new Date(endAt);
	const sameMonth =
		start.getMonth() === end.getMonth() &&
		start.getFullYear() === end.getFullYear();

	const startText = start.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
	const endText = end.toLocaleDateString(undefined, {
		month: sameMonth ? undefined : "short",
		day: "numeric",
	});

	return `${startText} – ${endText}`;
}

export function daysRemaining(endAt: number): number {
	return Math.ceil((endAt - Date.now()) / MS_PER_DAY);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	["year", 365 * MS_PER_DAY],
	["month", 30 * MS_PER_DAY],
	["week", 7 * MS_PER_DAY],
	["day", MS_PER_DAY],
	["hour", 60 * 60 * 1000],
	["minute", 60 * 1000],
];

/** "3 hours ago", "yesterday", or "just now" under a minute. */
export function formatRelativeTime(value: number, now = Date.now()): string {
	const elapsed = value - now;
	const format = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
	for (const [unit, size] of RELATIVE_UNITS) {
		if (Math.abs(elapsed) >= size) {
			return format.format(Math.round(elapsed / size), unit);
		}
	}
	return "just now";
}
