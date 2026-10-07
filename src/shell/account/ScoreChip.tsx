import { ScoreBadge } from "~/components/shared/ScoreBadge";

type ScoreChipProps = {
	readonly score: number;
};

/** No Pro variant, no special styling — user-level Pro indicators removed (#19, ADR-0005). */
export function ScoreChip({ score }: ScoreChipProps) {
	return <ScoreBadge score={score} />;
}
