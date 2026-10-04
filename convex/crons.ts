import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
	"start each Pro month with its hackathon credits",
	{ hourUTC: 0, minuteUTC: 10 },
	internal.billing.credits.grantProCredits,
	{},
);

export default crons;
