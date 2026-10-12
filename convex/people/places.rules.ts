import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { MAX_BUILDERS, MAX_LISTED_HACKATHONS } from "../shared/limits";
import type { hackathonStatus } from "../shared/validators";
import {
	isThreadUnread,
	loadHackathonThreads,
	loadTeamThreads,
	loadThreadRead,
} from "../chat/threads.rules";
import type { Infer } from "convex/values";

type HackathonStatus = Infer<typeof hackathonStatus>;

/** What a Founder may owe one of their Hackathons right now. */
export type HackathonSignals = {
	status: HackathonStatus;
	hasApplicant: boolean;
	hasReview: boolean;
	threadUnread: boolean;
	hasUndecided: boolean;
};

export type StartupSignals = {
	teamUnread: boolean;
	isFounder: boolean;
	boardReview: boolean;
	hackathons: HackathonSignals[];
};

export type BuilderSignals = {
	threadUnread: boolean;
	promisePending: boolean;
};

/** Whether a Startup place has something for this person. */
export function startupWaiting(startup: StartupSignals): boolean {
	if (startup.teamUnread) {
		return true;
	}
	if (!startup.isFounder) {
		return false;
	}
	return (
		startup.boardReview ||
		startup.hackathons.some((hackathon) => {
			switch (hackathon.status) {
				case "open":
					return hackathon.hasApplicant;
				case "building":
					return hackathon.hasReview || hackathon.threadUnread;
				case "deciding":
					return hackathon.hasUndecided;
				default:
					return false;
			}
		})
	);
}

/** Whether a Hackathon the person builds in has something for them. */
export function builderWaiting(builder: BuilderSignals): boolean {
	return builder.threadUnread || builder.promisePending;
}

/** A decision is in, and the Builder hasn't said whether the promise was kept. */
export function isPromisePending(application: Doc<"applications">): boolean {
	return (
		application.decision !== undefined && application.promiseKept === undefined
	);
}

async function anyUnread(
	ctx: QueryCtx,
	threads: Doc<"threads">[],
	userId: Id<"users">,
): Promise<boolean> {
	for (const thread of threads) {
		const read = await loadThreadRead(ctx, thread._id, userId);
		if (isThreadUnread(thread, read)) {
			return true;
		}
	}
	return false;
}

async function hasCardInReview(
	ctx: QueryCtx,
	startupId: Id<"startups">,
	hackathonId: Id<"hackathons"> | undefined,
): Promise<boolean> {
	const cards = await ctx.db
		.query("cards")
		.withIndex("by_startup_and_hackathon_and_status", (q) =>
			q
				.eq("startupId", startupId)
				.eq("hackathonId", hackathonId)
				.eq("status", "review"),
		)
		.take(1);
	return cards.length > 0;
}

async function loadHackathonSignals(
	ctx: QueryCtx,
	hackathon: Doc<"hackathons">,
	userId: Id<"users">,
): Promise<HackathonSignals> {
	const signals: HackathonSignals = {
		status: hackathon.status,
		hasApplicant: false,
		hasReview: false,
		threadUnread: false,
		hasUndecided: false,
	};
	if (hackathon.status === "open") {
		const applicants = await ctx.db
			.query("applications")
			.withIndex("by_hackathon_and_status", (q) =>
				q.eq("hackathonId", hackathon._id).eq("status", "applied"),
			)
			.take(1);
		signals.hasApplicant = applicants.length > 0;
	}
	if (hackathon.status === "building") {
		signals.hasReview = await hasCardInReview(
			ctx,
			hackathon.startupId,
			hackathon._id,
		);
		signals.threadUnread = await anyUnread(
			ctx,
			await loadHackathonThreads(ctx, hackathon._id),
			userId,
		);
	}
	if (hackathon.status === "deciding") {
		const building = await ctx.db
			.query("applications")
			.withIndex("by_hackathon_and_status", (q) =>
				q.eq("hackathonId", hackathon._id).eq("status", "building"),
			)
			.take(MAX_BUILDERS);
		signals.hasUndecided = building.some(
			(application) => application.decision === undefined,
		);
	}
	return signals;
}

/** Gathers the booleans `startupWaiting` decides on. Only a Founder reads the Board and Hackathons. */
export async function loadStartupSignals(
	ctx: QueryCtx,
	startupId: Id<"startups">,
	userId: Id<"users">,
	isFounder: boolean,
): Promise<StartupSignals> {
	const teamUnread = await anyUnread(
		ctx,
		await loadTeamThreads(ctx, startupId),
		userId,
	);
	if (!isFounder) {
		return { teamUnread, isFounder, boardReview: false, hackathons: [] };
	}

	const hackathons = await ctx.db
		.query("hackathons")
		.withIndex("by_startup", (q) => q.eq("startupId", startupId))
		.order("desc")
		.take(MAX_LISTED_HACKATHONS);
	return {
		teamUnread,
		isFounder,
		boardReview: await hasCardInReview(ctx, startupId, undefined),
		hackathons: await Promise.all(
			hackathons
				.filter(
					(hackathon) =>
						hackathon.status !== "draft" && hackathon.status !== "done",
				)
				.map((hackathon) => loadHackathonSignals(ctx, hackathon, userId)),
		),
	};
}

/** Gathers the booleans `builderWaiting` decides on: Everyone, then this Builder's private thread. */
export async function loadBuilderSignals(
	ctx: QueryCtx,
	application: Doc<"applications">,
): Promise<BuilderSignals> {
	const { hackathonId, userId } = application;
	const everyone = await ctx.db
		.query("threads")
		.withIndex("by_hackathon_and_kind", (q) =>
			q.eq("hackathonId", hackathonId).eq("kind", "everyone"),
		)
		.take(1);
	const priv = await ctx.db
		.query("threads")
		.withIndex("by_hackathon_and_builder", (q) =>
			q.eq("hackathonId", hackathonId).eq("builderId", userId),
		)
		.take(1);
	return {
		threadUnread: await anyUnread(ctx, [...everyone, ...priv], userId),
		promisePending: isPromisePending(application),
	};
}
