type HiringRecord = {
	readonly finished: number;
	readonly hires: number;
	readonly promisesKept: number;
	readonly promisesAnswered: number;
	readonly undecided: number;
};

function plural(n: number, word: string): string {
	return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** "2 hackathons · 1 hire · promises kept 3/3", or null with nothing to show. */
export function hiringLine(record: HiringRecord): string | null {
	if (record.finished === 0 && record.undecided === 0) {
		return null;
	}
	const parts = [plural(record.finished, "hackathon")];
	if (record.hires > 0) {
		parts.push(plural(record.hires, "hire"));
	}
	if (record.promisesAnswered > 0) {
		parts.push(
			`promises kept ${record.promisesKept}/${record.promisesAnswered}`,
		);
	}
	if (record.undecided > 0) {
		parts.push(`didn't decide ${record.undecided}`);
	}
	return parts.join(" · ");
}
