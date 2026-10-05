import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	type ProofLinkKind,
	proofLinkLabel,
} from "~/features/work/pulses/constants";

type PulseProofLinksProps = {
	readonly proofLinks: readonly { kind: ProofLinkKind; url: string }[];
	readonly canEdit: boolean;
	readonly isPending: boolean;
	/** Resolves true once the link is saved; the kind is inferred from the URL. */
	readonly onAdd: (url: string) => Promise<boolean>;
	readonly onRemove: (url: string) => void;
};

export function PulseProofLinks({
	proofLinks,
	canEdit,
	isPending,
	onAdd,
	onRemove,
}: PulseProofLinksProps) {
	const [isAdding, setIsAdding] = useState(false);
	const [url, setUrl] = useState("");

	async function add() {
		if (url.trim() && (await onAdd(url.trim()))) {
			setUrl("");
			setIsAdding(false);
		}
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
							onClick={() => onRemove(link.url)}
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
					onClick={() => setIsAdding(true)}
				>
					Add proof
				</Button>
			) : null}
			<Dialog open={isAdding} onOpenChange={setIsAdding}>
				<DialogContent>
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							void add();
						}}
					>
						<DialogHeader>
							<DialogTitle>Add proof of work</DialogTitle>
							<DialogDescription>
								Paste a link to a PR, commit, deploy, design, doc or demo.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-2">
							<Label htmlFor="proof-link-url">Link</Label>
							<Input
								id="proof-link-url"
								type="url"
								inputMode="url"
								value={url}
								onChange={(event) => setUrl(event.target.value)}
								placeholder="https://github.com/…/pull/12"
								className="h-11"
								autoFocus
							/>
						</div>
						<DialogFooter>
							<Button type="submit" disabled={isPending || !url.trim()}>
								Add proof
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
