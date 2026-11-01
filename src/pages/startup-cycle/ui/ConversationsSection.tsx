import { ConversationRow, useConversations } from "~/entities/conversation";
import { useWorkspace } from "~/entities/startup";
import {
	ConversationInput,
	useConversationActions,
} from "~/features/log-conversation";
import { Button } from "~/shared/ui/button";
import { Section } from "~/shared/ui/Section";

/** "Who you talk to this week": one line per conversation. The team's alone, and never public. */
export function ConversationsSection() {
	const { startup, userId, isFounder } = useWorkspace();
	const conversations = useConversations(startup._id);
	const { add, remove } = useConversationActions(startup._id);

	return (
		<Section label="Who you talk to this week">
			<ConversationInput onAdd={add} />
			{conversations?.length ? (
				<ul className="flex flex-col divide-y divide-border">
					{conversations.map((conversation) => (
						<ConversationRow
							key={conversation._id}
							line={conversation.line}
							author={conversation.author}
							trailing={
								isFounder || conversation.authorId === userId ? (
									<Button
										variant="ghost"
										size="sm"
										className="text-muted-foreground"
										onClick={() => void remove(conversation._id)}
									>
										Remove
									</Button>
								) : null
							}
						/>
					))}
				</ul>
			) : null}
		</Section>
	);
}
