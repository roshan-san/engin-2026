import { test as base, type Page } from "@playwright/test";
import { CONVEX_URL } from "./convex";
import type { Person } from "./people";

/** Matches how @convex-dev/auth namespaces its localStorage keys. */
const namespace = CONVEX_URL.replace(/[^a-zA-Z0-9]/g, "");

type Fixtures = {
	/** A page in its own browser context, signed in as `person`. */
	pageAs: (person: Person) => Promise<Page>;
};

export const test = base.extend<Fixtures>({
	pageAs: async ({ browser }, use) => {
		const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
		await use(async (person) => {
			const context = await browser.newContext();
			contexts.push(context);
			await context.addInitScript(
				({ namespace, tokens }) => {
					// Only once: the app rotates the refresh token after this.
					const jwtKey = `__convexAuthJWT_${namespace}`;
					if (localStorage.getItem(jwtKey) === null) {
						localStorage.setItem(jwtKey, tokens.token);
						localStorage.setItem(
							`__convexAuthRefreshToken_${namespace}`,
							tokens.refreshToken,
						);
					}
				},
				{ namespace, tokens: person.tokens },
			);
			return await context.newPage();
		});
		for (const context of contexts) {
			await context.close();
		}
	},
});

export { expect } from "@playwright/test";
