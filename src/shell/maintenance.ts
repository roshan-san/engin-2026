/** Where a browser keeps the pass once you've unlocked production. */
export const PASS_KEY = "engin:pass";

/**
 * Set on a deployment to show the maintenance page there. It holds the SHA-256
 * of the pass, never the pass itself, because everything in the bundle is public.
 */
export const passHash: string | undefined =
	import.meta.env.VITE_MAINTENANCE_PASS_HASH || undefined;

export async function sha256Hex(text: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(text),
	);
	return Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}

function readPass(): string | null {
	try {
		return localStorage.getItem(PASS_KEY);
	} catch {
		return null;
	}
}

function writePass(pass: string): void {
	try {
		localStorage.setItem(PASS_KEY, pass);
	} catch {
		// Blocked storage: you're in for this visit only.
	}
}

function forgetPass(): void {
	try {
		localStorage.removeItem(PASS_KEY);
	} catch {
		// Nothing stored to forget.
	}
}

/**
 * Whether this visitor gets past maintenance. `#unlock=<pass>` stores the pass,
 * `#lock` forgets it. The fragment never reaches the server, so the pass stays
 * out of request logs.
 */
export async function resolveGate(
	hash: string | undefined,
	fragment: string,
): Promise<"open" | "locked"> {
	if (!hash) {
		return "open";
	}
	if (fragment === "#lock") {
		forgetPass();
		return "locked";
	}
	const unlock = fragment.match(/^#unlock=(.+)$/);
	if (unlock) {
		const pass = decodeURIComponent(unlock[1]);
		if ((await sha256Hex(pass)) === hash) {
			writePass(pass);
			return "open";
		}
	}
	const stored = readPass();
	return stored !== null && (await sha256Hex(stored)) === hash
		? "open"
		: "locked";
}
