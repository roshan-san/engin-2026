import { HACKATHON_TEXT } from "../hackathons/rules";

export const MAX_CONTRIBUTORS = 100;

/** Longest allowed text per Contributor field. A hire's label starts as the Hackathon's title, so it must fit one. */
export const CONTRIBUTOR_TEXT = { label: HACKATHON_TEXT.title };
