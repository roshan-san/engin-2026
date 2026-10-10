import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { Person } from "../people/users.helpers";
import type { Setup } from "../startups/startups.helpers";

/** A valid What shipped: a line and one proof link. */
export const SHIPPED = {
	line: "Sent welcome emails",
	links: ["https://example.com/doc"],
	images: [] as Id<"_storage">[],
};

/** A new Card on the Startup's Board, owned by `as`. */
export async function cardOn(
	setup: Setup,
	as: Person,
	title: string,
): Promise<Id<"cards">> {
	return await as.as.mutation(api.work.cards.create, {
		startupId: setup.startupId,
		title,
	});
}
