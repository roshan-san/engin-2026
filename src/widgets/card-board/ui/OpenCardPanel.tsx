import { useCardBoard } from "../model/CardBoard";
import type { PanelProps } from "./CardHeader";
import { CardPanel } from "./CardPanel";

/** The CardBoard's open Card, or nothing when none is open. */
export function OpenCardPanel(panel: PanelProps) {
	const { openCardId, ship } = useCardBoard();

	return openCardId ? (
		<CardPanel key={openCardId} cardId={openCardId} onShip={ship} {...panel} />
	) : null;
}
