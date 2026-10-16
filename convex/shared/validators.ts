import { v } from "convex/values";

export const threadKind = v.union(
	v.literal("team"),
	v.literal("everyone"),
	v.literal("private"),
);

export const jobRole = v.union(
	v.literal("frontend"),
	v.literal("backend"),
	v.literal("fullstack"),
	v.literal("designer"),
	v.literal("marketing"),
	v.literal("sales"),
	v.literal("ops"),
	v.literal("other"),
);
export const jobPay = v.union(
	v.literal("3_6l"),
	v.literal("6_9l"),
	v.literal("9_15l"),
	v.literal("equity"),
	v.literal("unpaid"),
);
export const jobMode = v.union(
	v.literal("remote"),
	v.literal("onsite"),
	v.literal("hybrid"),
);
export const hackathonStatus = v.union(
	v.literal("draft"),
	v.literal("open"),
	v.literal("building"),
	v.literal("deciding"),
	v.literal("done"),
);
export const applicationStatus = v.union(
	v.literal("applied"),
	v.literal("declined"),
	v.literal("building"),
);
export const decision = v.union(v.literal("hired"), v.literal("not_this_time"));

export const discipline = v.union(
	v.literal("engineer"),
	v.literal("designer"),
	v.literal("marketing"),
	v.literal("sales"),
	v.literal("ops"),
	v.literal("other"),
);

export const startupStage = v.union(
	v.literal("idea"),
	v.literal("building"),
	v.literal("launched"),
	v.literal("earning"),
);
export const startupCategory = v.union(
	v.literal("saas"),
	v.literal("consumer"),
	v.literal("fintech"),
	v.literal("d2c"),
	v.literal("ai"),
	v.literal("marketplace"),
	v.literal("other"),
);
export const startupCity = v.union(
	v.literal("bengaluru"),
	v.literal("delhi_ncr"),
	v.literal("mumbai"),
	v.literal("hyderabad"),
	v.literal("pune"),
	v.literal("chennai"),
	v.literal("remote"),
	v.literal("other"),
);
export const inviteStatus = v.union(
	v.literal("pending"),
	v.literal("accepted"),
	v.literal("declined"),
	v.literal("revoked"),
);

export const cardStatus = v.union(
	v.literal("todo"),
	v.literal("in_progress"),
	/** Submitted, waiting for the Founder to verify. */
	v.literal("review"),
	v.literal("done"),
);

/** What shipped: the line, proof links and images a Contributor submits. */
export const shipped = v.object({
	line: v.string(),
	links: v.array(v.string()),
	images: v.array(v.id("_storage")),
});

export const activityKind = v.union(
	v.literal("card_verified"),
	v.literal("contributor_joined"),
	v.literal("hackathon_finished"),
	v.literal("builder_hired"),
);

export const planKey = v.union(
	v.literal("monthly"),
	v.literal("six_months"),
	v.literal("yearly"),
);
/** Dodo's subscription statuses. Only `active` unlocks Pro. */
export const subscriptionStatus = v.union(
	v.literal("pending"),
	v.literal("active"),
	v.literal("on_hold"),
	v.literal("paused"),
	v.literal("cancelled"),
	v.literal("failed"),
	v.literal("expired"),
);
