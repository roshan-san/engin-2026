import {
	createContext,
	type Dispatch,
	type ReactNode,
	useContext,
	useEffect,
	useReducer,
	useState,
} from "react";
import {
	type Crumb,
	type CrumbAction,
	crumbReducer,
} from "~/shell/crumbs/crumbs";

const CrumbState = createContext<Crumb | null>(null);
const CrumbDispatch = createContext<Dispatch<CrumbAction> | null>(null);

let nextOwner = 0;

export function CrumbProvider({ children }: { readonly children: ReactNode }) {
	const [crumb, dispatch] = useReducer(crumbReducer, null);

	return (
		<CrumbDispatch.Provider value={dispatch}>
			<CrumbState.Provider value={crumb}>{children}</CrumbState.Provider>
		</CrumbDispatch.Provider>
	);
}

/**
 * Shows `label` as the third top-bar crumb while the calling page is mounted.
 * A no-op while `label` is still loading, or outside the signed-in shell.
 */
export function useCrumb(label: string | undefined, href: string) {
	const dispatch = useContext(CrumbDispatch);
	const [owner] = useState(() => ++nextOwner);

	useEffect(() => {
		if (!dispatch || label === undefined) return;
		dispatch({ type: "set", crumb: { owner, label, href } });
		return () => dispatch({ type: "unset", owner });
	}, [dispatch, owner, label, href]);
}

export function useCurrentCrumb(): Crumb | null {
	return useContext(CrumbState);
}
