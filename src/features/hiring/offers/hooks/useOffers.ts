import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** The signed-in contributor's Offers; `pending` are the ones still to answer. */
export function useOffers() {
	const offers = useQuery(api.hiring.offers.listMine, {});
	const pending = offers?.filter((offer) => offer.status === "pending") ?? [];

	return { offers, pending };
}
