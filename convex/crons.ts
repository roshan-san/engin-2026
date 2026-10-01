import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
	"grant monthly Pro hackathon credits",
	{ hourUTC: 0, minuteUTC: 10 },
	internal.billing.credits.grantMonthlyProCredits,
	{},
);

export default crons;
