import { useState } from "react";
import { Countdown } from "~/components/shared/Countdown";
import { GlowHero } from "~/components/shared/GlowHero";
import { LiveBadge } from "~/components/shared/LiveBadge";
import { Row, RowList } from "~/components/shared/RowList";
import { StatusDot } from "~/components/shared/StatusDot";

const HOUR = 60 * 60 * 1000;

const LANES = [
	{ name: "Maya R.", progress: "3 of 4 Tasks done", status: "review" },
	{ name: "Dev K.", progress: "2 of 4 Tasks done", status: "in_progress" },
	{ name: "Sam T.", progress: "1 of 4 Tasks done", status: "in_progress" },
] as const;

/** A static hackathon screen: the live hero and one lane per Participant. */
export function HackathonMock() {
	// Fixed once per mount so the countdown never reads "Ended".
	const [endsAt] = useState(() => Date.now() + 53 * HOUR);

	return (
		<GlowHero
			size="compact"
			titleAs="h2"
			eyebrow={<LiveBadge status="active" />}
			title="Founding Designer hackathon"
		>
			<Countdown to={endsAt} />
			<div className="mt-4">
				<RowList>
					{LANES.map((lane) => (
						<Row
							key={lane.name}
							leading={<StatusDot status={lane.status} />}
							title={lane.name}
							trailing={lane.progress}
						/>
					))}
				</RowList>
			</div>
		</GlowHero>
	);
}
