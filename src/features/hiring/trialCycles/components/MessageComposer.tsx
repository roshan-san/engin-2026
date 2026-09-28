import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { toErrorMessage } from "~/lib/validation";

type MessageComposerProps = {
	readonly placeholder: string;
	readonly submitLabel: string;
	readonly onSend: (body: string) => Promise<unknown>;
};

export function MessageComposer({
	placeholder,
	submitLabel,
	onSend,
}: MessageComposerProps) {
	const [body, setBody] = useState("");
	const [isPending, setIsPending] = useState(false);

	async function submit() {
		if (!body.trim()) {
			return;
		}
		setIsPending(true);
		try {
			await onSend(body.trim());
			setBody("");
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not send"));
		} finally {
			setIsPending(false);
		}
	}

	return (
		<form
			className="flex flex-col gap-2 sm:flex-row"
			onSubmit={(event) => {
				event.preventDefault();
				void submit();
			}}
		>
			<Input
				value={body}
				onChange={(event) => setBody(event.target.value)}
				placeholder={placeholder}
				className="h-11 flex-1"
			/>
			<Button
				type="submit"
				disabled={isPending || !body.trim()}
				className="h-11"
			>
				{submitLabel}
			</Button>
		</form>
	);
}
