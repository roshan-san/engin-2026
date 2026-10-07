// Empties every table in the Convex *dev* deployment, then pushes the current
// schema, so a schema change goes through even when old rows no longer match.
// Refuses to touch anything but a dev deployment. Non-interactive.
// Usage: pnpm data:clear            (clear, then push)
//        pnpm data:clear --no-push  (clear only)
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CONCURRENCY = 8;

const env = readFileSync(".env.local", "utf8");
const deployment = env.match(/^CONVEX_DEPLOYMENT=(\S+)/m)?.[1];
if (!deployment?.startsWith("dev:")) {
	console.error(`Refusing: CONVEX_DEPLOYMENT is "${deployment}", not a dev deployment.`);
	process.exit(1);
}

// The CLI's own entry point: no shell, so arguments arrive as written.
const CLI = ["node_modules/convex/bin/main.js"];

function convexSync(args) {
	const result = spawnSync(process.execPath, [...CLI, ...args], {
		encoding: "utf8",
	});
	if (result.status !== 0) {
		throw new Error(`convex ${args.join(" ")} failed:\n${result.stderr}`);
	}
	return result.stdout;
}

function convex(args) {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [...CLI, ...args], {
			stdio: ["ignore", "ignore", "pipe"],
		});
		let stderr = "";
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.on("close", (code) =>
			code === 0
				? resolve()
				: reject(new Error(`convex ${args.join(" ")} failed:\n${stderr}`)),
		);
	});
}

const tables = convexSync(["data"])
	.split("\n")
	.map((line) => line.trim())
	.filter((line) => /^[A-Za-z_]\w*$/.test(line));

const empty = join(mkdtempSync(join(tmpdir(), "convex-clear-")), "empty.jsonl");
writeFileSync(empty, "");

console.log(`Clearing ${tables.length} tables in ${deployment}`);
const queue = [...tables];
async function worker() {
	for (let table = queue.shift(); table; table = queue.shift()) {
		await convex(["import", "--table", table, "--replace", "-y", empty]);
		console.log(`  cleared ${table}`);
	}
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

if (process.argv.includes("--no-push")) {
	console.log("Done. Run `pnpm dev:backend` to push the current schema.");
} else {
	console.log("Pushing the current schema…");
	convexSync(["dev", "--once"]);
	console.log("Done: every table is empty and the schema is current.");
}
