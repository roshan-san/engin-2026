// Deletes every document in a Convex deployment. `pnpm wipe:dev` or `pnpm wipe:prod`.
// For while there are no users: change the schema, wipe, skip the migration.
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";

const target = process.argv[2];
if (target !== "dev" && target !== "prod") {
	console.error("Usage: node scripts/wipe.ts dev|prod");
	process.exit(1);
}

if (target === "prod") {
	const phrase = "wipe prod";
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	const answer = await rl.question(
		`This deletes ALL production data. Type "${phrase}" to go on: `,
	);
	rl.close();
	if (answer !== phrase) {
		console.log("Nothing deleted.");
		process.exit(1);
	}
}

// A zip with no files in it: importing it with --replace-all clears every table.
const emptyZip = Buffer.alloc(22);
emptyZip.write("PK\x05\x06");
const zipPath = join(mkdtempSync(join(tmpdir(), "wipe-")), "empty.zip");
writeFileSync(zipPath, emptyZip);

const { status } = spawnSync(
	"pnpm",
	[
		"exec",
		"convex",
		"import",
		"--replace-all",
		"--yes",
		...(target === "prod" ? ["--prod"] : []),
		`"${zipPath}"`,
	],
	{ stdio: "inherit", shell: true },
);
process.exit(status ?? 1);
