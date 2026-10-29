// Prints WCAG contrast ratios for the text tokens in src/app/styles/globals.css.
// Plain node, no deps. Exits 1 if any pair is below 4.5:1.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MIN_RATIO = 4.5;
const css = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "../src/app/styles/globals.css"),
	"utf8",
);

function parseBlock(body) {
	const out = {};
	for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
		out[name] = value.trim();
	}
	return out;
}

const rootBlock = css.match(/:root\s*\{([^}]*)\}/)?.[1];
if (!rootBlock) {
	console.error("No :root block found in globals.css");
	process.exit(1);
}

// :root first, then each [data-system] block layered over :root.
const rootTokens = parseBlock(rootBlock);
const blocks = [[":root", rootTokens]];
for (const [, name, body] of css.matchAll(
	/\[data-system="([\w-]+)"\]\s*\{([^}]*)\}/g,
)) {
	blocks.push([name, { ...rootTokens, ...parseBlock(body) }]);
}

let tokens = rootTokens;

function toRgb(name) {
	const hex = tokens[name]?.match(/^#([0-9a-f]{6})$/i)?.[1];
	if (!hex) {
		console.error(`--${name} is missing or not a 6-digit hex colour`);
		process.exit(1);
	}
	return [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
}

function luminance(name) {
	const [r, g, b] = toRgb(name).map((channel) => {
		const c = channel / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

const textTokens = [
	"foreground",
	"muted-foreground",
	"link",
	"warning",
	"success",
	"destructive",
	"tier-1",
	"tier-2",
	"tier-3",
	"tier-4",
	"tier-5",
];
const pairs = [
	...textTokens.flatMap((fg) => [
		[fg, "background"],
		[fg, "card"],
	]),
	["primary-foreground", "primary"],
];

let failed = false;
for (const [name, blockTokens] of blocks) {
	tokens = blockTokens;
	console.log(`
${name}`);
	for (const [fg, bg] of pairs) {
		const value = ratio(fg, bg);
		const ok = value >= MIN_RATIO;
		if (!ok) failed = true;
		console.log(
			`${ok ? "PASS" : "FAIL"}  ${fg.padEnd(18)} on ${bg.padEnd(11)} ${value.toFixed(2)}:1`,
		);
	}
}

if (failed) {
	console.error(`\nSome pairs are below ${MIN_RATIO}:1`);
	process.exit(1);
}
