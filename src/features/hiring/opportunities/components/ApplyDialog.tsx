import type { Id } from "@convex/_generated/dataModel";
import { LIVE_ENTRY_LIMIT_MESSAGE } from "@convex/hiring/applications.rules";
import { useConvexAuth } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { FieldError } from "~/components/ui/field";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { useApply } from "~/features/hiring/opportunities/hooks/useApply";
import { CONTRIBUTOR_IP_TERMS } from "~/features/hiring/hackathons/constants";
import { GoogleButton } from "~/features/people/auth/components/GoogleButton";

type ApplyDialogProps = {
	readonly hackathonId: Id<"hackathons">;
	readonly title: string;
	readonly size?: "sm" | "default";
};

/** Every Apply button: sign in first when signed out, else the note and IP tick. */
export function ApplyDialog({
	hackathonId,
	title,
	size = "default",
}: ApplyDialogProps) {
	const { isAuthenticated } = useConvexAuth();
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button type="button" size={size} onClick={() => setOpen(true)}>
				Apply
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[90vh] overflow-y-auto">
					{isAuthenticated ? (
						<ApplyForm
							hackathonId={hackathonId}
							title={title}
							onApplied={() => setOpen(false)}
						/>
					) : (
						<SignInToApply hackathonId={hackathonId} title={title} />
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

function SignInToApply({
	hackathonId,
	title,
}: Pick<ApplyDialogProps, "hackathonId" | "title">) {
	return (
		<>
			<DialogHeader>
				<DialogTitle>Sign in to apply</DialogTitle>
				<DialogDescription>
					Sign in to apply to “{title}”. You'll come back to this hackathon.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<GoogleButton
					label="Continue with Google"
					returnTo={`/hackathons/${hackathonId}`}
				/>
			</DialogFooter>
		</>
	);
}

type ApplyFormProps = Pick<ApplyDialogProps, "hackathonId" | "title"> & {
	readonly onApplied: () => void;
};

function ApplyForm({ hackathonId, title, onApplied }: ApplyFormProps) {
	const [message, setMessage] = useState("");
	const [acceptTerms, setAcceptTerms] = useState(false);
	const { apply, error, isPending } = useApply(hackathonId);

	async function submit() {
		if (await apply(message)) {
			toast.success("Application sent");
			onApplied();
		}
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>Apply to “{title}”</DialogTitle>
				<DialogDescription>
					The startup's founders review every application and accept who joins.
				</DialogDescription>
			</DialogHeader>

			<div className="space-y-2">
				<Label htmlFor="apply-message">Note to the Founders (optional)</Label>
				<Textarea
					id="apply-message"
					value={message}
					onChange={(event) => setMessage(event.target.value)}
					disabled={isPending}
					rows={4}
				/>
			</div>

			<div className="flex items-start gap-3 rounded-lg border p-3">
				<Checkbox
					id="apply-ip-terms"
					checked={acceptTerms}
					onCheckedChange={(checked) => setAcceptTerms(checked === true)}
					disabled={isPending}
					className="mt-0.5"
				/>
				<Label
					htmlFor="apply-ip-terms"
					className="text-sm leading-snug font-normal"
				>
					{CONTRIBUTOR_IP_TERMS}
				</Label>
			</div>

			{error ? (
				<div className="space-y-3">
					<FieldError>{error}</FieldError>
					{error === LIVE_ENTRY_LIMIT_MESSAGE ? (
						<Button asChild variant="outline">
							<Link to="/my-hackathons">Go to My Hackathons</Link>
						</Button>
					) : null}
				</div>
			) : null}

			<DialogFooter>
				<Button
					type="button"
					disabled={!acceptTerms || isPending}
					onClick={() => void submit()}
				>
					{isPending ? <Spinner /> : null}
					Apply
				</Button>
			</DialogFooter>
		</>
	);
}
