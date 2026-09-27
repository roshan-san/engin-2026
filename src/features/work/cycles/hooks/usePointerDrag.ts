import { useRef, useState } from "react";

const DRAG_THRESHOLD_PX = 6;
const DROP_ZONE_ATTRIBUTE = "data-drop-zone";

type DragState<T> = { item: T; dx: number; dy: number; over: string | null };

/**
 * Pointer-event drag and drop, so the same gesture works with mouse and touch
 * (HTML5 drag events don't fire for touch). Drop zones are marked with
 * `data-drop-zone="<id>"`.
 */
export function usePointerDrag<T>(onDrop: (item: T, zone: string) => void) {
	const [drag, setDrag] = useState<DragState<T> | null>(null);
	const start = useRef<{ x: number; y: number; item: T } | null>(null);

	function zoneAt(x: number, y: number): string | null {
		const element = document.elementFromPoint(x, y);
		return (
			element
				?.closest(`[${DROP_ZONE_ATTRIBUTE}]`)
				?.getAttribute(DROP_ZONE_ATTRIBUTE) ?? null
		);
	}

	function handlers(item: T) {
		return {
			onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
				if (event.button !== 0) {
					return;
				}
				start.current = { x: event.clientX, y: event.clientY, item };
				event.currentTarget.setPointerCapture(event.pointerId);
			},
			onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
				const origin = start.current;
				if (!origin) {
					return;
				}
				const dx = event.clientX - origin.x;
				const dy = event.clientY - origin.y;
				if (!drag && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
					return;
				}
				setDrag({
					item: origin.item,
					dx,
					dy,
					over: zoneAt(event.clientX, event.clientY),
				});
			},
			onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
				const zone = drag ? zoneAt(event.clientX, event.clientY) : null;
				const origin = start.current;
				start.current = null;
				setDrag(null);
				if (origin && zone) {
					onDrop(origin.item, zone);
				}
			},
			onPointerCancel: () => {
				start.current = null;
				setDrag(null);
			},
		};
	}

	return {
		drag,
		handlers,
		dropZoneProps: (id: string) => ({ [DROP_ZONE_ATTRIBUTE]: id }),
	};
}
