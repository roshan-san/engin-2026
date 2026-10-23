import { createContext, useContext, useMemo, useRef, useState } from "react";
import { ShipDialog } from "../cards/ShipDialog";
import type { CardView } from "./types";

type CardBoardValue = {
	/** The Card open in the side panel, marked on the Board. */
	readonly openCardId: string | undefined;
	readonly open: (cardId: string) => void;
	readonly close: () => void;
	/** Opens What shipped for a Card going to Review. */
	readonly ship: (card: CardView) => void;
};

const CardBoardContext = createContext<CardBoardValue | null>(null);

/**
 * One Board of Cards and its open Card: put `Board` and `OpenCardPanel` inside.
 * It shows What shipped when a Card goes to Review, from the Board or the panel.
 */
export function CardBoard({
	cardId,
	onCardChange,
	children,
}: {
	readonly cardId: string | undefined;
	/** Opens a Card, or closes the open one with `undefined`. */
	readonly onCardChange: (cardId: string | undefined) => void;
	readonly children: React.ReactNode;
}) {
	const [shipping, setShipping] = useState<CardView | null>(null);
	// Always the latest onCardChange, but stable functions, so the Board's key
	// listener isn't re-added on every render of the page.
	const changeLatest = useRef(onCardChange);
	changeLatest.current = onCardChange;
	const value = useMemo(
		() => ({
			openCardId: cardId,
			open: (id: string) => changeLatest.current(id),
			close: () => changeLatest.current(undefined),
			ship: setShipping,
		}),
		[cardId],
	);

	return (
		<CardBoardContext.Provider value={value}>
			{children}
			{shipping ? (
				<ShipDialog card={shipping} onClose={() => setShipping(null)} />
			) : null}
		</CardBoardContext.Provider>
	);
}

export function useCardBoard(): CardBoardValue {
	const value = useContext(CardBoardContext);
	if (!value) {
		throw new Error("useCardBoard needs a CardBoard");
	}
	return value;
}
