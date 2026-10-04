export const IP_TERMS_MESSAGE = "Accept the hackathon IP terms to continue";

/**
 * Founders (at publish) and contributors (at entry) both acknowledge that
 * contributors keep ownership of what they submit (design: IP of submissions).
 */
export function requireIpTerms(accepted: boolean): void {
	if (!accepted) {
		throw new Error(IP_TERMS_MESSAGE);
	}
}
