const GROUP_GAP = 5 * 60_000;

export type MessageGroup<M extends { author: unknown }> = {
	author: M["author"];
	/** When the group's first message was sent. */
	at: number;
	messages: M[];
};

/**
 * Messages (oldest first) as runs by one author. A new group starts when the
 * author changes or more than 5 minutes passed since the group's last message.
 */
export function groupMessages<
	M extends { author: { _id: string }; at: number },
>(messages: M[]): MessageGroup<M>[] {
	const groups: MessageGroup<M>[] = [];
	for (const message of messages) {
		const group = groups.at(-1);
		const last = group?.messages.at(-1);
		if (
			group &&
			last &&
			group.author._id === message.author._id &&
			message.at - last.at <= GROUP_GAP
		) {
			group.messages.push(message);
		} else {
			groups.push({
				author: message.author,
				at: message.at,
				messages: [message],
			});
		}
	}
	return groups;
}
