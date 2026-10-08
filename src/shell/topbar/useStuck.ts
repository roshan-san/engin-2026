import { useEffect, useRef, useState } from "react";

/**
 * True once the sentinel (placed right above a sticky bar) has scrolled out
 * of view, which is when that bar is stuck to the top.
 */
export function useStuck() {
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const [stuck, setStuck] = useState(false);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;
		const observer = new IntersectionObserver(([entry]) => {
			setStuck(!entry.isIntersecting);
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, []);

	return { sentinelRef, stuck };
}
