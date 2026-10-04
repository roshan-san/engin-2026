# Common rules for every Phase 2 implementer

Project: Engin (Vite + React 19 + TanStack Router + Convex + Tailwind v4 + shadcn/ui + Biome, pnpm). Working directory: D:\codex\engin-2026\.claude\worktrees\phase-02 (git worktree, branch phase-02). Work and commit ONLY there. Never cd to D:\codex\engin-2026 except to READ the project guide below.

Project guide (the plans call it @CLAUDE.md): read D:/codex/engin-2026/AGENTS.md first. Follow it: Convex guidelines in convex/_generated/ai/guidelines.md, withIndex not .filter, tabs + double quotes, semantic Tailwind tokens only, no arbitrary values, mobile-first, files under ~250 lines, domain glossary in CONTEXT.md (use its terms: Pulse, Cycle, Founder, Member, Board, Proof Link, Verified Pulse, ...). Never hand-edit src/routeTree.gen.ts or convex/_generated/** (the router plugin regenerates routeTree.gen.ts during `pnpm build`/`pnpm dev`; commit the regenerated file).

Your brief is a GSD PLAN file. Ignore its <execution_context> block (GSD workflow files) — do not run GSD commands, do not edit .planning/STATE.md, .planning/ROADMAP.md or any other plan file. Do follow every <task> in order, its <read_first>, <action>, <verify> and <acceptance_criteria>, and create the SUMMARY file named in its <output> block (a concise record: what was built, key decisions/deviations, files, exports/contracts later plans rely on, test results). Earlier plans' SUMMARY files in .planning/phases/02-my-pulses-cycle-boards/ describe what already exists.

@.claude/skills/shadcn/SKILL.md does not exist in this repo; if you need shadcn guidance, invoke the Skill tool with skill "shadcn".

Commits: one commit per plan task (conventional style like `feat(02-01): ...` / `test(02-01): ...`), plus one `docs(02-NN): summary` commit for the SUMMARY. Stage explicit paths only (never `git add -A`/`git add .`). End every commit message with the line:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

Commands: `pnpm test [file]`, `pnpm test -t "name"`, `pnpm exec tsc -p convex/tsconfig.json --noEmit`, `pnpm check` (lint+format --write + tsc), `pnpm build`. `pnpm check` rewrites formatting — stage what it changes. Run `pnpm check` and the full `pnpm test` before your final commit. The shell is Git Bash on Windows.

Do not install packages the plan does not name. Do not dispatch subagents.

Line endings: core.autocrlf=true and Biome writes LF, so after `pnpm check` `git status` shows ~200 files modified with no content change. That is noise: stage only the files you changed. Never commit files you did not intend to change.
