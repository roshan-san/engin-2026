// Empties every table in the Convex *dev* deployment, so a schema change can
// be pushed when old rows no longer match. Refuses to touch anything else.
// Usage: pnpm data:clear
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const env = readFileSync(".env.local", "utf8");
const deployment = env.match(/^CONVEX_DEPLOYMENT=(\S+)/m)?.[1];
if (!deployment?.startsWith("dev:")) {
	console.error(`Refusing: CONVEX_DEPLOYMENT is "${deployment}", not a dev deployment.`);
	process.exit(1);
}

function convex(args) {
	const result = spawnSync("pnpm", ["exec", "convex", ...args], {
		encoding: "utf8",
		shell: true,
	});
	if (result.status !== 0) {
		throw new Error(`convex ${args.join(" ")} failed:\n${result.stderr}`);
	}
	return result.stdout;
}

const tables = convex(["data"])
	.split("\n")
	.map((line) => line.trim())
	.filter((line) => /^[A-Za-z_]\w*$/.test(line));

const empty = join(mkdtempSync(join(tmpdir(), "convex-clear-")), "empty.jsonl");
writeFileSync(empty, "");

console.log(`Clearing ${tables.length} tables in ${deployment}`);
for (const table of tables) {
	convex(["import", "--table", table, "--replace", "-y", empty]);
	console.log(`  cleared ${table}`);
}
console.log("Done. Run `pnpm dev:backend` to push the current schema.");
