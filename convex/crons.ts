import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sunday 18:35 UTC is Monday 00:05 IST, just after a Cycle ends.
crons.cron(
	"score the week",
	"35 18 * * 0",
	internal.momentum.scoreStartups,
	{},
);

export default crons;
