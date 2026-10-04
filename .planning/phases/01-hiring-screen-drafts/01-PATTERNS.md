# Phase 1: Hiring Screen & Drafts - Pattern Map

**Mapped:** 2026-10-04
**Files analyzed:** 34 (new + modified, Phase 1 scope only: HIRE-01/02/03/09, D-11, D-23)
**Analogs found:** 31 / 34

All analog paths below are git-tracked source.

## File Classification

### Backend (`convex/`)
| File | New/Mod | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|---|
| `convex/hiring/hiring.schema.ts` | mod | model/schema | - | itself (drop `trialAdmission` lines 6-9 + `admission` line 65; add `expectedOutcome`, `evaluationCriteria`, `compensation` as `v.optional(v.string())`) | exact |
| `convex/hiring/trialCycles.ts` | mod | controller (endpoints) | CRUD | itself: `create` (lines ~106-160), `reschedule`, `cancel` | exact |
| `convex/hiring/trialCycles.rules.ts` | mod | service (rules) | transform/guard | itself: `isTrialLive`, `requireAcceptingEntries` (lines 41-54) | exact |
| `convex/hiring/challenges.rules.ts` | mod | service (rules) | CRUD | itself `listChallenges` (5-13) + `challenges.ts` `add` (46-71) | exact |
| `convex/hiring/roles.ts` | mod | controller | CRUD | itself `close` (end of file) | exact |
| `convex/hiring/roles.rules.ts` | NEW | service (rules guard) | request-response | `convex/hiring/trialCycles.rules.ts` | role-match |
| `convex/hiring/applications.ts` | mod | controller | CRUD | itself (delete `joinTrial` 127-158; drop admission check 101-103) | exact |
| `convex/hiring/opportunities.ts` | mod | controller | query | itself (drop `admission` line 76) | exact |
| `convex/hiring/trialCycles.helpers.ts` | mod | test fixture | - | itself (`createDraftTrial`, `startedTrialWith`, `applicationIdOf`) | exact |
| `convex/hiring/trialCycles.drafts.test.ts` | NEW | test | - | `convex/hiring/roles.test.ts`, `trialCycles.test.ts` | exact |
| `convex/hiring/roles.test.ts` | mod | test | - | itself ("a filled Role cannot be reopened", lines 98-111) | exact |
| `applications/trialCycles/challenges/trialMessages/notifications/explore/credits/pulses.board .test.ts` | mod | test | - | replace `joinTrial` with `enterTrial` fixture | exact |
| `convex/lib/limits.ts` | mod | config | - | itself (`MAX_TRIAL_CHALLENGES`, `MAX_ROLE_TRIALS`) | exact |
| `convex/lib/text.ts` | mod (optional) | utility | transform | itself (`requireText`, `optionalText`, `limitText`) | exact |

### Frontend (`src/`)
| File | New/Mod | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|---|
| `src/routes/_shell/_authed/s/$slug/_member/hiring/index.tsx` | mod | route | - | `src/routes/_shell/_authed/s/$slug/trials/$trialCycleId.tsx` | exact |
| `.../_member/hiring/new.tsx` | NEW | route | - | same | exact |
| `.../_member/hiring/$trialCycleId/edit.tsx` | NEW | route (param) | - | same | exact |
| `src/features/hiring/screen/pages/HiringPage.tsx` | NEW | page | request-response | `src/features/hiring/trialCycles/pages/TrialCyclePage.tsx` | role-match |
| `src/features/hiring/screen/hooks/useHiringScreen.ts` | NEW | hook | query | `src/features/hiring/trialCycles/hooks/useTrialCycle.ts` | exact |
| `src/features/hiring/screen/components/{HackathonsTab,HackathonRow,RolesTab,RoleRow,HiringEmptyState}.tsx` | NEW | component | presentational | `src/features/work/cycles/components/StartCycleForm.tsx` (props + hook destructure style) | partial |
| `src/features/hiring/roles/hooks/useRoles.ts` | NEW | hook | CRUD | `src/features/work/cycles/hooks/useCycleForm.ts` | exact |
| `src/features/hiring/roles/components/NewRoleForm.tsx` | NEW | component (form) | request-response | `StartCycleForm.tsx` | exact |
| `src/features/hiring/roles/schemas/role.ts` | NEW | schema | transform | `src/features/people/profile/schemas/profile.ts` | exact |
| `src/features/hiring/trialCycles/pages/HackathonFormPage.tsx` | NEW | page | request-response | `TrialCyclePage.tsx` | exact |
| `src/features/hiring/trialCycles/components/{HackathonForm,RolePicker,TrialScheduleFields,StartingPulsesField}.tsx` | NEW | component | presentational/controlled | `StartCycleForm.tsx` | role-match |
| `src/features/hiring/trialCycles/components/CancelHackathonDialog.tsx` | NEW | component | request-response | none (no AlertDialog yet; shadcn `alert-dialog` source) | none |
| `src/features/hiring/trialCycles/hooks/useHackathonForm.ts` | NEW | hook | CRUD | `useCycleForm.ts` + `src/features/teams/startup/public/hooks/useCreateStartupWizard.ts` (153-188) | exact |
| `src/features/hiring/trialCycles/hooks/useHackathonDraft.ts` | NEW | hook | query | `useTrialCycle.ts` | exact |
| `src/features/hiring/trialCycles/hooks/useCancelHackathon.ts` | NEW | hook | mutation | `useCycleForm.ts` | exact |
| `src/features/hiring/trialCycles/schemas/hackathon.ts` | NEW | schema | transform | `profile.ts` schema | exact |
| `src/features/hiring/trialCycles/constants.ts` | mod | config | - | itself / `src/features/hiring/roles/constants.ts` | exact |
| `src/lib/dates.ts` | mod | utility | transform | itself (`fromDateInput`/`toDateInput`) | exact |
| `src/shell/nav.ts` | mod | config | - | itself line 67 | exact |
| `ApplyButtons.tsx`, `ParticipantTrialActions.tsx`, `PublicOpenings.tsx` | mod | component | - | remove admission prop / join branch | exact |
| `src/features/teams/startup/workspace/components/WorkspaceRoles.tsx`, `WorkspaceTrials.tsx` | DELETE | - | - | - | - |
| `src/components/ui/{field,empty,alert-dialog,select,collapsible,spinner}.tsx` | NEW | ui | - | generated via `pnpm ui ...` (do not hand-write) | n/a |

## Pattern Assignments

### `convex/hiring/trialCycles.ts` — `create` change + NEW `update`

**Analog:** current `create` (trialCycles.ts ~106-160). Keep shape, extract the checks into rules:
```ts
handler: async (ctx, args) => {
	const userId = await requireUserId(ctx);
	await requireFounderMembership(ctx, args.startupId, userId);

	const role = await ctx.db.get(args.roleId);
	if (!role || role.startupId !== args.startupId) {
		throw new Error("Role not found");
	}
	if (role.status !== "open") {
		throw new Error("This Role is closed");
	}
	if (args.endsAt <= args.startsAt) {
		throw new Error("Trial Cycle end must be after start");
	}

	const title = requireText(args.title, "Title");
	const description = requireText(args.description, "Description");
	const maxContributors = Math.min(
		MAX_TRIAL_PARTICIPANTS,
		Math.max(1, Math.floor(args.maxContributors)),
	);

	const trialCycleId = await ctx.db.insert("trialCycles", {
		..., status: "draft", participantCount: 0,
		searchText: buildSearchText(title, description, role.title),
	});
	return trialCycleId;
},
```
- Move the role check into `requireOpenRoleOf(ctx, startupId, roleId)` (keep both messages verbatim), the date check into `requireValidSchedule(args, Date.now())`, and field building into pure `buildTrialFields(args, role)` in `trialCycles.rules.ts`.
- Remove `admission: trialAdmission` arg + `trialAdmission` import + `admission` insert.
- Declare a shared `draftFields` validator object (roleId, title, description, maxContributors, startsAt, endsAt, applicationDeadline?, prize?, expectedOutcome?, evaluationCriteria?, compensation?, `challenges: v.array(v.object({ title: v.string(), description: v.optional(v.string()) }))`) and spread it into both `create` (+ `startupId`) and `update` (+ `trialCycleId`).
- `update`: place right after `create` (mutations order). Body per RESEARCH Pattern 2: `requireUserId` → `ctx.db.get` + "Trial Cycle not found" → `requireFounderMembership(ctx, trial.startupId, userId)` → status `draft` check → `requireOpenRoleOf` → `requireValidSchedule` → `ctx.db.patch(trial._id, buildTrialFields(...))` (undefined clears optionals, same as `reschedule`) → `replaceChallenges`.
- `reschedule`: swap its inline `endsAt <= startsAt` check for `requireValidSchedule`.

### `convex/hiring/trialCycles.rules.ts` (add `requireOpenRoleOf`, `requireValidSchedule`, `buildTrialFields`)

**Analog:** same file, guard style lines 41-54:
```ts
export function isTrialLive(trial: Doc<"trialCycles">): boolean {
	return trial.status === "open" || trial.status === "active";
}

/** Entry closes at the application deadline, or at the start when none is set. */
export function requireAcceptingEntries(trial: Doc<"trialCycles">) {
	if (trial.status === "draft") {
		throw new Error("This hackathon isn't published yet");
	}
	...
}
```
Imports header (lines 1-8) shows convention: `type MutationCtx, QueryCtx` from `../_generated/server`, limits from `../lib/limits`, `type TrialCtx = QueryCtx | MutationCtx`. Text bounds via `requireText`/`limitText` from `../lib/text` with new constants from `../lib/limits`.

### `convex/hiring/challenges.rules.ts` (add `replaceChallenges`, `buildChallengeFields`)

**Analog:** `listChallenges` (lines 5-13) for bounded read, and `challenges.ts` `add` (lines 53-70) for insert shape + error copy:
```ts
if ((await listChallenges(ctx, trial._id)).length >= MAX_TRIAL_CHALLENGES) {
	throw new Error(
		`A Trial Cycle can have at most ${MAX_TRIAL_CHALLENGES} Challenges`,
	);
}
return await ctx.db.insert("challenges", {
	trialCycleId: trial._id,
	startupId: trial.startupId,
	title: requireText(args.title, "Challenge title"),
	description: optionalText(args.description),
	createdByUserId: userId,
});
```
`replaceChallenges` = length check, delete all from `listChallenges`, insert each (RESEARCH Pattern 3). Safe on drafts: `copyChallengeToBoard` (lines 15-31) stores no challengeId. Optionally have `add` reuse `buildChallengeFields`.

### `convex/hiring/roles.rules.ts` (NEW) + `roles.ts close`

**Analog:** `trialCycles.rules.ts` header/guard style. Move `parseSkills` (roles.ts lines 11-15) here. New guard (RESEARCH Pattern 4) using `by_role` index + `MAX_ROLE_TRIALS` + `isTrialLive` imported from `./trialCycles.rules`, message `"Cancel this Role's hackathons first."`.

Current `close` (end of roles.ts) — insert guard after founder check:
```ts
await requireFounderMembership(ctx, role.startupId, userId);
await requireNoLiveHackathons(ctx, role._id); // NEW
await ctx.db.patch(args.roleId, { status: "closed" });
```
Optionally replace `roles.list` literal `.take(50)` with `MAX_LISTED_ROLES` in `lib/limits.ts`. `create` is unchanged (already returns `roleId`, logs `role_posted`).

### `convex/hiring/trialCycles.helpers.ts`

**Analog:** itself. Changes:
- `TrialOverrides`: drop `admission`; add `challenges?: { title: string; description?: string }[]` defaulting to `[]` (Pitfall 6: no publish gate in Phase 1).
- `createDraftTrial`: drop `admission: overrides.admission ?? "open"`, add `challenges: overrides.challenges ?? []`.
- NEW `enterTrial(setup, trialCycleId, person)`: `person.as.mutation(api.hiring.applications.applyToTrial, { trialCycleId, acceptTerms: true })`, then founder `decide({ applicationId: await applicationIdOf(setup.t, trialCycleId, person.userId), status: "joined" })`.
- `startedTrialWith` loop currently:
```ts
for (const participant of participants) {
	await participant.as.mutation(api.hiring.applications.joinTrial, {
		acceptTerms: true,
		trialCycleId,
	});
}
```
→ `await enterTrial(setup, trialCycleId, participant);`

### Tests: `trialCycles.drafts.test.ts` (NEW), `roles.test.ts` (add D-23 test)

**Analog:** `roles.test.ts` imports (1-11) and test shape (98-111):
```ts
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest, DAY } from "../lib/testing.helpers";
import { setUpStartup } from "../teams/startups.helpers";
import { createTrial, ... } from "./trialCycles.helpers";

test("a filled Role cannot be reopened", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await setup.founder.as.mutation(api.hiring.roles.close, { roleId: setup.roleId });

	const roles = await setup.founder.as.query(api.hiring.roles.list, { startupId: setup.startupId });
	expect(roles[0]?.status).toBe("closed");
});
```
Note: that existing test closes a Role with no trials, so it still passes after D-23. Add: "a Role with an unpublished hackathon cannot be closed" (`createDraftTrial` then `expect(...close...).rejects.toThrow("Cancel this Role's hackathons first.")`) and "closing works once its hackathons are cancelled". Drafts test file: use `describe("create"|"update"|"schedule")` (~10+ tests): update only on draft, member forbidden, closed Role rejected, challenges replaced, optionals cleared, drafts invisible to non-members. No `vi.useFakeTimers()`.

### Route files

**Analog:** `src/routes/_shell/_authed/s/$slug/trials/$trialCycleId.tsx` (full file):
```tsx
import { createFileRoute } from "@tanstack/react-router";
import { TrialCyclePage } from "~/features/hiring/trialCycles/pages/TrialCyclePage";

export const Route = createFileRoute(
	"/_shell/_authed/s/$slug/trials/$trialCycleId",
)({
	component: TrialCycleRoute,
});

function TrialCycleRoute() {
	const { slug, trialCycleId } = Route.useParams();
	return <TrialCyclePage slug={slug} trialCycleId={trialCycleId} />;
}
```
IDs: `"/_shell/_authed/s/$slug/_member/hiring/"` (keep), `".../hiring/new"`, `".../hiring/$trialCycleId/edit"`. Replace the `StubScreen` in `hiring/index.tsx`. Add both new ids to `SCREEN_TITLES` in `src/shell/nav.ts` next to line 67 (`"/_shell/_authed/s/$slug/_member/hiring/": "Hiring",`). Regenerate `routeTree.gen.ts`.

### Pages: `HiringPage.tsx`, `HackathonFormPage.tsx`

**Analog:** `src/features/hiring/trialCycles/pages/TrialCyclePage.tsx` (lines 1-40): readonly props type, hook call, `undefined` → `<PageLoading rows={3} />`, `null`/slug mismatch → `<Navigate ... replace />`:
```tsx
const { trial } = useTrialCycle(trialCycleId);
if (trial === undefined) {
	return <PageLoading rows={3} />;
}
if (trial === null || trial.startupSlug !== slug) {
	return <Navigate to="/startup/$slug" params={{ slug }} replace />;
}
```
Founder check: `useStartupRoute().member?.role === "founder"` (`src/shell/startup/StartupRoute.tsx` ~105-108). Form page: non-founder → `<Navigate to="/s/$slug/hiring" params={{ slug }} />`; edit mode non-draft → notice + link back (Pitfall 4/5). HiringPage gets `headerAside?: ReactNode` slot (Phase 2 credit badge), shadcn `Tabs` (exists) Hackathons|Roles.

### Hooks: `useHiringScreen`, `useHackathonDraft`

**Analog:** `src/features/hiring/trialCycles/hooks/useTrialCycle.ts` (full):
```ts
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

export function useTrialCycle(trialCycleId: string) {
	const trial = useQuery(api.hiring.trialCycles.get, {
		trialCycleId: trialCycleId as Id<"trialCycles">,
	});
	return { trial, isLoading: trial === undefined };
}
```
`useHiringScreen(startupId)`: `trialCycles.list` + group with `TRIAL_STATUS_GROUPS` (hide empty). `useHackathonDraft`: `trialCycles.get` + `challenges.list` (pass `"skip"` until founder known).

### Hooks: `useHackathonForm`, `useRoles`, `useCancelHackathon`

**Analog:** `src/features/work/cycles/hooks/useCycleForm.ts` (full):
```ts
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

export function useCycleForm(startupId: Id<"startups">) {
	const createCycle = useMutation(api.work.cycles.create);
	const [title, setTitle] = useState("");
	const [isPending, setIsPending] = useState(false);

	async function create() {
		setIsPending(true);
		try {
			await createCycle({ ... });
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not create Cycle"));
		} finally {
			setIsPending(false);
		}
	}
	return { title, setTitle, isPending, create };
}
```
Add: early `if (isPending) return;` (Pitfall 3), `validate(hackathonSchema, input)` from `~/lib/validation` → `toast.error(result.message)` on failure (see `useCreateStartupWizard.ts` 153-188), `useNavigate()` to `/s/$slug/hiring` on success. Signature `submit(intent: "save" | "publish")`; Phase 1 only calls `"save"`. Initialize edit state once from `initialValues` (key form by `trialCycleId`). `useRoles`: `roles.list` + `roles.create` (returns id; caller selects it) + `roles.close`.

### Schemas: `schemas/hackathon.ts`, `roles/schemas/role.ts`

**Analog:** `src/features/people/profile/schemas/profile.ts`: optional-text idiom
```ts
z.string().trim().max(280, "Bio must be under 280 characters")
	.transform((value) => value || undefined).optional(),
...
export type ProfileInput = z.infer<typeof profileSchema>;
```
Full hackathon schema in RESEARCH "Client schema". Import maxes from `@convex/lib/limits` (plain constants). Role schema: title, type (enum of `ROLE_TYPES` values), skills (comma string → array, like profile `skills`), description, headcount int ≥ 1 default 1.

### Form components (`HackathonForm`, `NewRoleForm`, `TrialScheduleFields`, `RolePicker`, `StartingPulsesField`)

**Analog:** `src/features/work/cycles/components/StartCycleForm.tsx` (1-50): `readonly` props type, destructure hook, `<form onSubmit={(e)=>{e.preventDefault(); void create();}}>`, `Input className="h-11"`, `grid grid-cols-1 gap-2 sm:grid-cols-2` for date pair. Deviations required by shadcn skill: `FieldGroup`/`Field`/`FieldLabel` instead of bare inputs, `gap-*` not `space-y-*`, `Spinner` + `disabled` on submit, `type="datetime-local"` (not `date`). `TrialScheduleFields` is controlled (value/onChange/disabled/error), no Convex calls. `RolePicker` uses shadcn `Select`; `ROLE_TYPES` from `src/features/hiring/roles/constants.ts`. More details via `Collapsible`.

### `src/lib/dates.ts`

**Analog:** existing pair:
```ts
export function fromDateInput(value: string): number {
	return new Date(`${value}T00:00:00.000Z`).getTime();
}
export function toDateInput(value: number): string {
	return new Date(value).toISOString().slice(0, 10);
}
```
Add `fromDateTimeInput`/`toDateTimeInput` local-time versions (RESEARCH Code Examples) — do not use `toISOString()`. Display rows with existing `formatDateRange`.

### `src/features/hiring/trialCycles/constants.ts`

Add `TRIAL_STATUS_GROUPS` and status labels (`draft`→"Unpublished", `active`→"Running") in the same `as const` array style as `ROLE_TYPES` in `src/features/hiring/roles/constants.ts`.

## Shared Patterns

### Handler preamble (all backend mutations)
**Source:** `convex/hiring/roles.ts` `create`/`close`
```ts
const userId = await requireUserId(ctx);
await requireFounderMembership(ctx, args.startupId, userId);
```
Imports: `requireUserId` from `../lib/auth`; `requireFounderMembership`, `requireMembership` from `../teams/membership.rules`.

### Text validation
**Source:** `convex/lib/text.ts` (`requireText`, `optionalText`, `buildSearchText`, `limitText`) as used in `roles.ts create` and `trialCycles.ts create`. Add bounds constants to `convex/lib/limits.ts`; mirror in zod.

### Bounded reads
`.withIndex(...).take(CONST)` with constants from `convex/lib/limits.ts` (see `listChallenges`, `listTrialApplications`). Never `.collect()`.

### Client error surfacing
**Source:** `src/lib/validation.ts` — `validate(schema, input)` for first-message zod errors; `toast.error(toErrorMessage(error, fallback))` for backend errors shown verbatim.

### Data access in hooks only
`useQuery`/`useMutation` only in `src/features/**/hooks/*`; components receive props. Delete `WorkspaceRoles.tsx` / `WorkspaceTrials.tsx` (violators, unused).

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `CancelHackathonDialog.tsx` | component | No AlertDialog in repo yet; use shadcn `alert-dialog` from `pnpm ui`, `consequence?: string` prop, status copy from RESEARCH "Cancel dialog copy" |
| `HiringEmptyState.tsx` | component | No shadcn `Empty` usage yet; existing `StubScreen` is the nearest visual reference |
| `StartingPulsesField.tsx` | component | Cycle pulse-add UI exists only inside `CyclePulseBoard.tsx`; build as controlled list of `{title, description?}` |

## Metadata

**Analog search scope:** `convex/hiring/`, `convex/lib/`, `src/features/{hiring,work,people,teams}/`, `src/routes/_shell/_authed/s/$slug/`, `src/lib/`, `src/shell/`
**Files scanned:** ~25
**Pattern extraction date:** 2026-10-04
