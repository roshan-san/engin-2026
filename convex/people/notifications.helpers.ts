import { api } from "../_generated/api";
import type { Client } from "../lib/testing.helpers";

export async function notificationTitles(as: Client) {
	const { notifications } = await as.query(api.people.notifications.list, {});
	return notifications.map((notification) => notification.title);
}
