/** "10:00" for 600 minutes from midnight. */
export function timeLabel(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Every quarter hour of the day, in minutes from midnight. */
export const START_TIMES: readonly number[] = Array.from(
	{ length: 96 },
	(_, index) => index * 15,
);

/** Meeting lengths to pick from, in minutes. */
export const LENGTHS: readonly number[] = [15, 30, 45, 60, 90, 120];
