import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { toErrorMessage } from "~/lib/validation";

type TrialChatProps = {
	readonly trialCycleId: Id<"trialCycles">;
};

export function TrialChat({ trialCycleId }: TrialChatProps) {
	const messages = useQuery(api.hiring.trialMessages.list, { trialCycleId });
	const send = useMutation(api.hiring.trialMessages.send);
	const [body, setBody] = useState("");
	const [isPending, setIsPending] = useState(false);

	async function submit() {
		if (!body.trim()) {
			return;
		}
		setIsPending(true);
		try {
			await send({ trialCycleId, body: body.trim() });
			setBody("");
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not send message"));
		} finally {
			setIsPending(false);
		}
	}

	return (
		<section className="space-y-4">
			<h2 className="text-lg font-semibold">Messages</h2>
			{messages === undefined ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : messages.length === 0 ? (
				<p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
					No messages yet. Keep Trial Cycle communication here.
				</p>
			) : (
				<ul className="space-y-2">
					{messages.map((message) => (
						<li key={message._id} className="rounded-lg border p-3">
							<p className="text-sm font-medium">
								{message.user?.name ?? message.user?.username ?? "Member"}
							</p>
							<p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
						</li>
					))}
				</ul>
			)}
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
					placeholder="Write a message"
					className="h-11 flex-1"
				/>
				<Button
					type="submit"
					disabled={isPending || !body.trim()}
					className="h-11"
				>
					Send
				</Button>
			</form>
		</section>
	);
}
