import { RatingBadge } from "./RatingBadge";
import { RatingParts } from "./RatingParts";
import type { SignalsView } from "./record";
import { RhythmStrip } from "./RhythmStrip";

/** The Rating, its parts and the rhythm strip. */
export function RecordSignals({ signals }: { readonly signals: SignalsView }) {
	return (
		<section className="flex flex-col gap-3">
			<RatingBadge
				rating={signals.rating}
				ratingChange={signals.ratingChange}
				isProvisional={signals.isProvisional}
			/>
			<RatingParts parts={signals.parts} />
			<RhythmStrip strip={signals.strip} />
		</section>
	);
}
