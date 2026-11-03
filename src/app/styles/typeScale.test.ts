import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const SOURCES = import.meta.glob<string>("/src/**/*.{ts,tsx}", {
	query: "?raw",
	import: "default",
	eager: true,
});

const SIZE_CLASS = /(?<![\w-])text-(xs|sm|base|lg|\d*xl)(?![\w-])/g;
const ARBITRARY_SIZE_CLASS = /(?<![\w-])text-\[\d[^\]]*\]/g;

function themeSizes(): Set<string> {
	// From disk: Vitest empties imported CSS, even with ?raw.
	const css = readFileSync("src/app/styles/globals.css", "utf8");
	return new Set(
		[...css.matchAll(/--text-(\w+):/g)].map(([, size]) => size as string),
	);
}

describe("the type scale", () => {
	test("reads the sizes from the theme", () => {
		expect(themeSizes()).toContain("sm");
	});

	// The theme resets Tailwind's sizes, so a class outside it renders no CSS and the text silently stays body size.
	test("every text size used is in the theme", () => {
		const sizes = themeSizes();
		const unknown = Object.entries(SOURCES).flatMap(([path, source]) =>
			[...source.matchAll(SIZE_CLASS)]
				.filter(([, size]) => !sizes.has(size as string))
				.map(([match]) => `${path}: ${match}`),
		);
		expect(unknown).toEqual([]);
	});

	test("no arbitrary text sizes", () => {
		const arbitrary = Object.entries(SOURCES).flatMap(([path, source]) =>
			[...source.matchAll(ARBITRARY_SIZE_CLASS)].map(
				([match]) => `${path}: ${match}`,
			),
		);
		expect(arbitrary).toEqual([]);
	});
});
