import { useLocation } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import { roleLabel } from "~/features/hiring/jobChips";
import { useCrumbHackathon } from "~/shell/useCrumbHackathon";

/** "› Frontend" inside a Hackathon's space, "› New hackathon" on the form; nothing elsewhere. */
export function HackathonCrumb() {
	const { pathname } = useLocation();
	const match = pathname.match(/^\/s\/[^/]+\/hiring\/([^/]+)/);
	const segment = match?.[1];
	const hackathonId = segment && segment !== "new" ? segment : undefined;
	const found = useCrumbHackathon(hackathonId);

	if (segment === "new") {
		return <Crumb>New hackathon</Crumb>;
	}
	if (!found) {
		return null;
	}
	return <Crumb>{roleLabel(found.hackathon.job.role)}</Crumb>;
}

function Crumb({ children }: { readonly children: ReactNode }) {
	return (
		<span className="flex items-center gap-1 text-sm">
			<ChevronRightIcon
				aria-hidden
				className="size-4 shrink-0 text-subtle-foreground"
			/>
			<span aria-current="page" className="font-medium">
				{children}
			</span>
		</span>
	);
}
