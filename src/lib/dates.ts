const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function fromDateInput(value: string): number {
	return new Date(`${value}T00:00:00.000Z`).getTime();
}

export function toDateInput(value: number): string {
	return new Date(value).toISOString().slice(0, 10);
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
