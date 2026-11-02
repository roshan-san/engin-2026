import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useKept } from "~/shared/lib/useKept";
import { type PeopleSearch, parsePeopleSearch } from "../model/peopleSearch";

/**
 * People who match the filter, best Rating first. `people` keeps the previous rows
 * while a new filter loads (`undefined` only the first time); `isLoading` says they
 * may be out of date.
 */
export function useExplorePeople(search: PeopleSearch) {
	const live = useQuery(api.users.explore, parsePeopleSearch(search));
	const people = useKept(live, "explore-people");
	return { people, isLoading: live === undefined };
}
