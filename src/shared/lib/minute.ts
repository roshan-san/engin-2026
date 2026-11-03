import { useEffect, useState } from "react";

const MINUTE_MS = 60_000;

/** `at` without its seconds. */
export function floorToMinute(at: number): number {
	return at - (at % MINUTE_MS);
}

/** The time to the minute, updated as each minute turns. */
export function useMinute(): number {
	const [now, setNow] = useState(() => floorToMinute(Date.now()));
	useEffect(() => {
		const tick = () => setNow(floorToMinute(Date.now()));
		// Wait for the next minute to turn, then tick every minute.
		let interval: ReturnType<typeof setInterval> | undefined;
		const timeout = setTimeout(
			() => {
				tick();
				interval = setInterval(tick, MINUTE_MS);
			},
			MINUTE_MS - (Date.now() % MINUTE_MS),
		);
		return () => {
			clearTimeout(timeout);
			clearInterval(interval);
		};
	}, []);
	return now;
}
