// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");

const steps = new Set(
	[
		...readFileSync(join(__dirname, "globals.css"), "utf8").matchAll(
			/--text-([a-z0-9]+):/g,
		),
	].map(([, step]) => step),
);

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		const isSource = /\.tsx?$/.test(entry.name);
		const isSkipped = /\.test\.ts$|\.gen\.ts$/.test(entry.name);
		return isSource && !isSkipped ? [path] : [];
	});
}

function matches(pattern: RegExp, allowed: string[] = []): string[] {
	return sourceFiles(SRC)
		.map((file) => relative(SRC, file).replaceAll("\\", "/"))
		.filter((file) => !allowed.includes(file))
		.flatMap((file) =>
			[...readFileSync(join(SRC, file), "utf8").matchAll(pattern)].map(
				([match]) => `${file}: ${match}`,
			),
		);
}

describe("type scale", () => {
	it("defines the steps the app uses", () => {
		expect([...steps].sort()).toEqual(
			["2xl", "3xl", "5xl", "base", "lg", "sm", "xs"].sort(),
		);
	});

	it("every text size in the app is a step on the scale", () => {
		const named = matches(/\btext-(?:xs|sm|base|lg|xl|\dxl)\b/g).filter(
			(hit) => !steps.has(hit.slice(hit.lastIndexOf("text-") + 5)),
		);
		const fixed = matches(/\btext-\[\d+(?:\.\d+)?(?:px|rem|em)\]/g);
		expect([...named, ...fixed]).toEqual([]);
	});
});

describe("shared components", () => {
	it("keyboard focus uses the focus-ring utility", () => {
		expect(matches(/focus-visible:ring-2\b/g)).toEqual([]);
	});

	it("only PersonAvatar and PlaceLogo build avatars", () => {
		expect(
			matches(/<AvatarFallback\b/g, [
				"features/people/PersonAvatar.tsx",
				"components/PlaceLogo.tsx",
			]),
		).toEqual([]);
	});
});
