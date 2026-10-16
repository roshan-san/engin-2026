import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PASS_KEY, resolveGate, sha256Hex } from "./maintenance";

let storage: Map<string, string>;

beforeEach(() => {
	storage = new Map();
	vi.stubGlobal("localStorage", {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => storage.set(key, value),
		removeItem: (key: string) => storage.delete(key),
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("the maintenance gate", () => {
	it("stays open when no pass is configured", async () => {
		expect(await resolveGate(undefined, "")).toBe("open");
	});

	it("locks out a visitor without the pass", async () => {
		const passHash = await sha256Hex("open-sesame");
		expect(await resolveGate(passHash, "")).toBe("locked");
	});

	it("lets you in with #unlock=<pass> and remembers you", async () => {
		const passHash = await sha256Hex("open-sesame");
		expect(await resolveGate(passHash, "#unlock=open-sesame")).toBe("open");
		expect(storage.get(PASS_KEY)).toBe("open-sesame");
		expect(await resolveGate(passHash, "")).toBe("open");
	});

	it("ignores a wrong pass", async () => {
		const passHash = await sha256Hex("open-sesame");
		expect(await resolveGate(passHash, "#unlock=guess")).toBe("locked");
		expect(storage.has(PASS_KEY)).toBe(false);
	});

	it("does not let in a visitor who stored the hash itself", async () => {
		const passHash = await sha256Hex("open-sesame");
		storage.set(PASS_KEY, passHash);
		expect(await resolveGate(passHash, "")).toBe("locked");
	});

	it("locks you out again with #lock", async () => {
		const passHash = await sha256Hex("open-sesame");
		await resolveGate(passHash, "#unlock=open-sesame");
		expect(await resolveGate(passHash, "#lock")).toBe("locked");
		expect(storage.has(PASS_KEY)).toBe(false);
	});

	it("stays locked when storage is blocked", async () => {
		vi.stubGlobal("localStorage", {
			getItem: () => {
				throw new Error("blocked");
			},
			setItem: () => {
				throw new Error("blocked");
			},
			removeItem: () => {
				throw new Error("blocked");
			},
		});
		const passHash = await sha256Hex("open-sesame");
		expect(await resolveGate(passHash, "")).toBe("locked");
	});
});
