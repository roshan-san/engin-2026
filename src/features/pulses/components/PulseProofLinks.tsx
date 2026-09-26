import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Button } from "~/components/ui/button";
import {
	inferProofLinkKind,
	type ProofLinkKind,
	proofLinkLabel,
} from "~/features/pulses/constants";

type PulseProofLinksProps = {
	readonly pulseId: Id<"pulses">;
	readonly proofLinks: readonly { kind: ProofLinkKind; url: string }[];
	readonly canEdit: boolean;
	readonly isPending: boolean;
	readonly run: (action: () => Promise<unknown>) => void;
};

export function PulseProofLinks({
	pulseId,
	proofLinks,
	canEdit,
	isPending,
	run,
}: PulseProofLinksProps) {
	const addProofLink = useMutation(api.pulses.addProofLink);
	const removeProofLink = useMutation(api.pulses.removeProofLink);

	function add() {
		const url = window.prompt(
			"Link to your work (PR, commit, deploy, design…)",
		);
		if (!url?.trim()) {
			return;
		}
		run(() =>
			addProofLink({ pulseId, url, kind: inferProofLinkKind(url.trim()) }),
		);
	}

	return (
		<>
			{proofLinks.map((link) => (
				<span key={link.url} className="inline-flex items-center">
					<Button asChild size="sm" variant="ghost">
						<a href={link.url} target="_blank" rel="noreferrer">
							{proofLinkLabel(link.kind)}
						</a>
					</Button>
					{canEdit ? (
						<Button
							type="button"
							size="sm"
							variant="ghost"
							aria-label={`Remove ${proofLinkLabel(link.kind)}`}
							disabled={isPending}
							onClick={() =>
								run(() => removeProofLink({ pulseId, url: link.url }))
							}
						>
							×
						</Button>
					) : null}
				</span>
			))}
			{canEdit ? (
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={isPending}
					onClick={add}
				>
					Add proof
				</Button>
			) : null}
		</>
	);
}
