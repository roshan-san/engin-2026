const IST = { timeZone: "Asia/Kolkata" } as const;
const MONTH = new Intl.DateTimeFormat("en-US", { ...IST, month: "short" });
const DAY = new Intl.DateTimeFormat("en-US", { ...IST, day: "numeric" });

/** A Cycle's IST dates: "Oct 12 – 18" within a month, "Sep 28 – Oct 4" across. */
export function cycleDates(startsAt: number, endsAt: number): string {
	const lastDay = endsAt - 1;
	const startMonth = MONTH.format(startsAt);
	const endMonth = MONTH.format(lastDay);
	const start = `${startMonth} ${DAY.format(startsAt)}`;
	const end =
		startMonth === endMonth
			? DAY.format(lastDay)
			: `${endMonth} ${DAY.format(lastDay)}`;

	return `${start} – ${end}`;
}
