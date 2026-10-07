import { useEffect, useState } from "react";
import { splitCountdown } from "./countdown";

const REFRESH_MS = 30_000;

function Tile({
	value,
	unit,
}: {
	readonly value: number;
	readonly unit: string;
}) {
	return (
		<div className="flex min-w-14 flex-col items-center rounded-md bg-background/60 px-3 py-2">
			<span className="text-xl font-semibold tabular-nums">{value}</span>
			<span className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
				{unit}
			</span>
		</div>
	);
}

/** Days / hrs / min until `to`, refreshed every 30s. Reads "Ended" once it has passed. */
export function Countdown({ to }: { readonly to: number }) {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), REFRESH_MS);
		return () => clearInterval(id);
	}, []);

	const parts = splitCountdown(to, now);
	if (!parts) {
		return <span className="text-sm text-muted-foreground">Ended</span>;
	}
	return (
		<div className="flex gap-2">
			<Tile value={parts.days} unit="days" />
			<Tile value={parts.hours} unit="hrs" />
			<Tile value={parts.minutes} unit="min" />
		</div>
	);
}
