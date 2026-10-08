import { useLayoutEffect } from "react";
import type { DesignSystem } from "~/features/design/systems";

/**
 * Applies `system` to the whole document (top bar included) while mounted.
 * A layout effect, so it lands before children's effects read the tokens.
 */
export function useDesignSystem(system: DesignSystem) {
	useLayoutEffect(() => {
		const root = document.documentElement;
		root.dataset.system = system;
		return () => {
			delete root.dataset.system;
		};
	}, [system]);
}
