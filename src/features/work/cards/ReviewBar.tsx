import { useState } from "react";
import { type CardView, useBoardScope } from "~/entities/card";
import { useMoveCard } from "~/features/move-card";
import { Button } from "~/shared/ui/button";
import { Kbd } from "~/shared/ui/Kbd";
import { Spinner } from "~/shared/ui/spinner";
import { useVerifyCard } from "../board/useVerifyCard";

/** The Founder's bar under a Card in Review: send it back, or Verify it. */
export function ReviewBar({
	card,
	canSendBack,
	onSentBack,
}: {
	readonly card: CardView;
	readonly canSendBack: boolean;
	/** Called once the Card has moved back to In progress. */
	readonly onSentBack: () => void;
}) {
	const scope = useBoardScope();
	const move = useMoveCard(scope);
	const verify = useVerifyCard(scope);
	const [isVerifying, setIsVerifying] = useState(false);
	const [isSendingBack, setIsSendingBack] = useState(false);

	async function handleVerify() {
		setIsVerifying(true);
		await verify(card);
		setIsVerifying(false);
	}

	async function handleSendBack() {
		setIsSendingBack(true);
		const isSent = await move(card._id, "in_progress");
		setIsSendingBack(false);
		// The Founder says what to change, in Notes.
		if (isSent) onSentBack();
	}

	return (
		<div className="flex shrink-0 gap-2 border-t border-border p-3">
			{canSendBack ? (
				<Button
					variant="outline"
					disabled={isSendingBack || isVerifying}
					onClick={() => void handleSendBack()}
				>
					{isSendingBack ? <Spinner /> : null}
					Send back
				</Button>
			) : null}
			<Button
				className="flex-1"
				disabled={isVerifying || isSendingBack}
				onClick={() => void handleVerify()}
			>
				{isVerifying ? <Spinner /> : null}
				Verify
				<Kbd className="border-primary-foreground/20 text-primary-foreground/60">
					V
				</Kbd>
			</Button>
		</div>
	);
}
