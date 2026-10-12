// Wipes the Convex *dev* deployment and pushes the current schema, so a schema
// change goes through even when old rows no longer match it.
//   1. Empties every table, the app's and each component's, in one
//      `import --replace-all` per scope (tables no longer in the schema go too).
//   2. Pushes the current schema and functions (`convex dev --once`).
//   3. Deletes every stored file and cancels every pending scheduled job
//      (`dev/reset:clearFilesAndJobs`, which only exists once pushed).
//   4. Checks that every table and `_storage` is empty.
// Refuses anything but a dev deployment. Non-interactive.
// Usage: pnpm data:clear            (everything above)
//        pnpm data:clear --no-push  (step 1 only)
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const COMPONENTS = ["presence"];
const NO_PUSH = process.argv.includes("--no-push");

const deployment =
	process.env.CONVEX_DEPLOYMENT ??
	readFileSync(".env.local", "utf8").match(/^CONVEX_DEPLOYMENT=(\S+)/m)?.[1];
if (!deployment?.startsWith("dev:") || process.env.CONVEX_DEPLOY_KEY) {
	console.error(`Refusing: "${deployment}" is not a dev deployment.`);
	process.exit(1);
}

/** Runs the Convex CLI's own entry point (no shell) and returns its stdout. */
function convex(args) {
	const result = spawnSync(
		process.execPath,
		["node_modules/convex/bin/main.js", ...args],
		{ encoding: "utf8", env: { ...process.env, NODE_NO_WARNINGS: "1" } },
	);
	if (result.status !== 0) {
		throw new Error(`convex ${args.join(" ")} failed:\n${result.stderr}`);
	}
	return result.stdout;
}

function scopeArgs(component) {
	return component ? ["--component", component] : [];
}

function listTables(component) {
	return convex(["data", ...scopeArgs(component)])
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => /^[A-Za-z_]\w*$/.test(line));
}

/** A stored (uncompressed) ZIP of empty files: a snapshot with no documents. */
function emptySnapshot(tables) {
	const locals = [];
	const centrals = [];
	let offset = 0;
	for (const table of tables) {
		const name = Buffer.from(`${table}/documents.jsonl`);
		const local = Buffer.alloc(30);
		local.writeUInt32LE(0x04034b50, 0);
		local.writeUInt16LE(20, 4); // version needed
		local.writeUInt16LE(0x21, 12); // date: 1980-01-01; crc and sizes stay 0
		local.writeUInt16LE(name.length, 26);
		const central = Buffer.alloc(46);
		central.writeUInt32LE(0x02014b50, 0);
		central.writeUInt16LE(20, 4); // version made by
		central.writeUInt16LE(20, 6); // version needed
		central.writeUInt16LE(0x21, 14);
		central.writeUInt16LE(name.length, 28);
		central.writeUInt32LE(offset, 42);
		locals.push(local, name);
		centrals.push(central, name);
		offset += local.length + name.length;
	}
	const directory = Buffer.concat(centrals);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(tables.length, 8);
	end.writeUInt16LE(tables.length, 10);
	end.writeUInt32LE(directory.length, 12);
	end.writeUInt32LE(offset, 16);
	return Buffer.concat([...locals, directory, end]);
}

function isEmpty(table, component) {
	const rows = convex([
		"data",
		table,
		"--limit",
		"1",
		"--format",
		"jsonl",
		...scopeArgs(component),
	]);
	return rows.trim() === "";
}

const scopes = [undefined, ...COMPONENTS];
const label = (component) => component ?? "app";
const scratch = mkdtempSync(join(tmpdir(), "convex-clear-"));

async function main() {
	console.log(`Clearing ${deployment}`);
	for (const component of scopes) {
		const tables = listTables(component);
		if (tables.length === 0) {
			console.log(`  ${label(component)}: no tables`);
			continue;
		}
		const snapshot = join(scratch, `${label(component)}.zip`);
		writeFileSync(snapshot, emptySnapshot(tables));
		convex([
			"import",
			"--replace-all",
			"-y",
			...scopeArgs(component),
			snapshot,
		]);
		console.log(`  ${label(component)}: emptied ${tables.length} tables`);
	}

	if (NO_PUSH) {
		console.log(
			"Done: tables are empty. Files and scheduled jobs remain; run without --no-push to clear them.",
		);
		return;
	}

	console.log("Pushing the current schema and functions…");
	convex(["dev", "--once"]);

	let files = 0;
	let jobs = 0;
	for (let done = false; !done; ) {
		const batch = JSON.parse(convex(["run", "dev/reset:clearFilesAndJobs"]));
		files += batch.files;
		jobs += batch.jobs;
		done = batch.done;
	}
	console.log(`  deleted ${files} files, cancelled ${jobs} scheduled jobs`);

	const left = scopes.flatMap((component) =>
		[...listTables(component), ...(component ? [] : ["_storage"])]
			.filter((table) => !isEmpty(table, component))
			.map((table) => `${label(component)}:${table}`),
	);
	if (left.length > 0) {
		throw new Error(`Still has documents: ${left.join(", ")}`);
	}
	console.log("Done: every table and file is gone, and the schema is current.");
}

try {
	await main();
} finally {
	rmSync(scratch, { recursive: true, force: true });
}
