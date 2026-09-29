---
last_mapped_commit: f0a648da4386d24b5ee96348a96bf0cf757ba15f
last_mapped_at: 2026-09-29
---
# Coding Conventions

**Analysis Date:** 2026-09-29

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `PendingOffers.tsx`)
- Utilities/hooks: camelCase (e.g., `useContributors.ts`, `cn.ts`)
- Feature organization: lowercase with hyphens (e.g., `src/features/hiring/trialCycles/`)
- Constants files: `constants.ts` at feature level
- Hooks: `use` prefix (e.g., `useTrialCycle.ts`, `useUpgrade.ts`)
- Test files: `*.test.ts` co-located next to code

**Functions:**
- camelCase for all functions (backends and frontend)
- Async handler functions use `async` keyword explicitly
- Private helpers preceded with `_` if needed (rarely used)
- Query/mutation handlers: semantic names matching domain (e.g., `listMine`, `accept`, `decline`)

**Variables:**
- camelCase for all variables and parameters
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_TRIAL_PARTICIPANTS`, `INVITE_TTL_MS`)
- Boolean variables use `is` or `has` prefix (e.g., `isParticipant`, `hasFailed`)
- Type variables use `T`, `U` for generics in constraints

**Types:**
- PascalCase for all type names (interfaces, types, classes)
- Union types describe intent (e.g., `"passed_with_offer" | "passed" | "not_passed"`)
- Type imports: `import type { SomeType }` (explicit type syntax)
- Inferred types: `type X = Infer<typeof someValidator>`

## Code Style

**Formatting:**
- Biome v2.5.14 is the formatter (`pnpm format`)
- Indentation: tabs (configured in `biome.json`)
- Quote style: double quotes (enforced by Biome)
- Line breaks: no hard limit enforced, but keep components under ~250 lines

**Linting:**
- Biome v2.5.14 for linting (`pnpm lint`)
- Recommended rules enabled in `biome.json`
- Shadcn UI primitives in `src/components/ui/` have overrides: a11y and noArrayIndexKey disabled
- Run `pnpm check` before committing (combines lint + format + TypeScript check)

**TypeScript:**
- Strict mode enabled (`strict: true`)
- No unused locals or parameters: `noUnusedLocals` and `noUnusedParameters`
- ES2022 target
- Module resolution: bundler
- Path aliases configured: `~/*` → `src/*`, `@convex/*` → `convex/*`

## Import Organization

**Order:**
1. External libraries (React, Convex, UI libs)
2. Type imports from external: `import type { SomeType }`
3. Convex API and types: `import { api } from "@convex/_generated/api"`
4. Path aliases (`~/`, `@convex/`)
5. Relative imports (rare, use path aliases instead)

**Path Aliases:**
- Frontend: `~/` maps to `src/`, so `import { Button } from "~/components/ui/button"`
- Backend: `@convex/` maps to `convex/`, so `import { api } from "@convex/_generated/api"`
- Use aliases instead of relative imports (improves refactoring)

**Auto-organize:** Biome's `organizeImports` runs on save (configured in `biome.json`)

## Error Handling

**Patterns:**
- Simple string error messages: `throw new Error("Offer not found")`
- Validate before use: Helper functions like `requireUserId(ctx)`, `requirePendingOffer(ctx, id)` throw on invalid state
- Convex server errors are parsed: `error.message.replace(/^\[.*?]\s*/, "")` removes framework prefix
- Frontend catches with try/catch: `catch (error) { toast.error(toErrorMessage(error, fallback)) }`
- No thrown objects or complex error classes — keep it simple
- Error messages are user-facing; avoid leaking implementation details

**Example:**

```typescript
// Backend (convex/hiring/offers.ts)
async function requirePendingOffer(
	ctx: MutationCtx,
	offerId: Id<"offers">,
): Promise<Doc<"offers">> {
	const offer = await ctx.db.get(offerId);
	if (!offer) {
		throw new Error("Offer not found");
	}
	if (offer.status !== "pending") {
		throw new Error("This Offer is no longer pending");
	}
	return offer;
}

// Frontend (PendingOffers.tsx)
async function respond(offerId: Id<"offers">, isAccepting: boolean) {
	setPendingId(offerId);
	try {
		await (isAccepting ? accept({ offerId }) : decline({ offerId }));
		toast.success(isAccepting ? "Welcome to the team" : "Offer declined");
	} catch (error) {
		toast.error(toErrorMessage(error, "Could not respond to the Offer"));
	} finally {
		setPendingId(null);
	}
}
```

## Logging

**Approach:**
- Activity logging via `logActivity(ctx, args)` for domain events (`convex/lib/activity.ts`)
- Notifications via `notify(ctx, notification)` and `notifyFounders(ctx, startupId, notification)` for user-facing messages
- No console logging in production code (use notifications and activity instead)
- Activity records are append-only: `activity.ts` schema, logged at mutation call sites

**When to Log:**
- Member joins: `logActivity` with `kind: "member_joined"`
- Offer accepted/declined: `logActivity` with `kind: "offer_accepted"` or similar
- Notifications: same handler that calls `logActivity`, typically with `notifyFounders`

**Example:**

```typescript
// convex/hiring/offers.ts
await logActivity(ctx, {
	startupId: offer.startupId,
	kind: "member_joined",
	actorUserId: offer.userId,
	summary: `${person?.name ?? "Someone"} joined the team`,
});

await notifyFounders(ctx, offer.startupId, {
	kind: "offer",
	title: `${person?.name ?? "Someone"} accepted your Offer`,
	href: await startupHref(ctx, offer.startupId, "team"),
});
```

## Comments

**When to Comment:**
- Explain *why*, not *what*: the code shows what it does
- Complex algorithm: link to design doc or ADR (e.g., "ADR 0001: ...")
- Non-obvious business logic: "Backfills defaults for accounts created before field existed"
- Edge cases: "Co-founders have equal powers, so Founder-facing news goes to all of them"
- Temporary workarounds: mark with `// TODO: ...` or `// FIXME: ...`

**JSDoc/TSDoc:**
- Function exports: brief one-liner explaining purpose
- No need to document parameters/return types in TypeScript (types are self-documenting)
- Example:

```typescript
/** Every Startup the caller belongs to, for the switcher and palette (SHELL-07). */
export const listMemberships = query({
	args: {},
	handler: async (ctx) => {
		// ...
	},
});
```

## Function Design

**Size:** Keep functions under ~50 lines; break complex logic into helpers

**Parameters:**
- Destructured objects preferred over positional args (easier to add fields later)
- Backend: context (`ctx`) always first, then `args`
- Frontend: hooks return objects with getters/setters, not tuples

**Return Values:**
- Single value or simple object (avoid tuples for frontend hooks)
- Promise<void> for side-effect functions (notifications, activity)
- Promise<Result | null> for data queries

**Example:**

```typescript
// Frontend hook (src/features/discover/hooks/useContributors.ts)
export function useContributors() {
	const [skill, setSkill] = useState("");
	const [location, setLocation] = useState("");
	const contributors = useQuery(api.teams.explore.contributors, {
		skill: skill || undefined,
		location: location || undefined,
	});

	return {
		skill,
		setSkill,
		location,
		setLocation,
		contributors,
	};
}

// Backend query (convex/teams/startups.ts)
export const listMemberships = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		// ...
		return memberships.map((entry) => ({
			startup: {
				_id: entry.startup._id,
				name: entry.startup.name,
				slug: entry.startup.slug,
			},
		}));
	},
});
```

## Module Design

**Exports:**
- Named exports for functions (`export const myFunction = ...`)
- Default exports not used (for clarity and easier refactoring)
- Type exports: `export type MyType = ...`

**Barrel Files:**
- Not used; import directly from module files
- Use path aliases to keep imports clean despite depth

**Constants:**
- Place magic numbers in `constants.ts` or `lib/limits.ts`
- Database limits: `convex/lib/limits.ts` (PLAN_LIMITS, MAX_TRIAL_PARTICIPANTS, etc.)
- Feature constants: `src/features/<domain>/<feature>/constants.ts` (e.g., `ROLE_TYPES`)

**Example:**

```typescript
// src/features/hiring/roles/constants.ts
export const ROLE_TYPES = [
	{ value: "engineering", label: "Engineering" },
	{ value: "design", label: "Design" },
	// ...
] as const;

// convex/lib/limits.ts
export const MAX_TRIAL_PARTICIPANTS = 10;
export const PLAN_LIMITS: { free: PlanLimits; pro: PlanLimits } = {
	free: {
		capacity: 5,
		openRoles: 1,
		// ...
	},
	// ...
};
```

## Component Patterns

**Functional Components:**
- React 19 functional components with hooks only
- No class components
- Component size: keep under ~250 lines (break into smaller components or extract hooks)

**Styling:**
- Tailwind v4 classes only
- Semantic color tokens: `bg-background`, `text-muted-foreground`, `border-border`
- No arbitrary values (e.g., no `w-[123px]`; use semantic sizes from theme)
- Mobile-first: `flex-col md:flex-row`, `grid-cols-1 md:grid-cols-2`

**Form Validation:**
- Zod validators in `features/<domain>/<feature>/schemas/`
- Use `validate(schema, input)` to check form data before submit
- Returns `{ ok: true; data: T }` or `{ ok: false; message: string }`

**Example:**

```typescript
// src/lib/validation.ts
export function validate<Schema extends z.ZodType>(
	schema: Schema,
	input: unknown,
): ValidationResult<z.infer<Schema>> {
	const result = schema.safeParse(input);

	if (result.success) {
		return { ok: true, data: result.data };
	}

	return {
		ok: false,
		message: result.error.issues[0]?.message ?? "Please check your input",
	};
}
```

---

*Convention analysis: 2026-09-29*
