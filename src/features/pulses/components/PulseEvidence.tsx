import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Button } from "~/components/ui/button";

type PulseEvidenceProps = {
	readonly pulseId: Id<"pulses">;
	readonly evidenceUrl: string | null;
	readonly canEdit: boolean;
	readonly isPending: boolean;
	readonly run: (action: () => Promise<unknown>) => void;
};

export function PulseEvidence({
	pulseId,
	evidenceUrl,
	canEdit,
	isPending,
	run,
}: PulseEvidenceProps) {
	const setEvidence = useMutation(api.pulses.setEvidence);

	function edit() {
		const next = window.prompt("Link to your work", evidenceUrl ?? "");
		if (next === null) {
			return;
		}
		run(() => setEvidence({ pulseId, evidenceUrl: next }));
	}

	return (
		<>
			{evidenceUrl ? (
				<Button asChild size="sm" variant="ghost">
					<a href={evidenceUrl} target="_blank" rel="noreferrer">
						Evidence
					</a>
				</Button>
			) : null}
			{canEdit ? (
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={isPending}
					onClick={edit}
				>
					{evidenceUrl ? "Edit link" : "Add evidence"}
				</Button>
			) : null}
		</>
	);
}
