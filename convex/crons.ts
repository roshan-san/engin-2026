import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sunday 18:35 UTC is Monday 00:05 IST, just after a Cycle ends.
crons.cron("score the week", "35 18 * * 0", internal.momentum.scoreUsers, {});

// 03:30 UTC is 09:00 IST.
crons.cron(
	"new applicants digest",
	"30 3 * * *",
	internal.email.newApplicantsDigest,
	{},
);
// Monday 06:30 UTC is 12:00 IST, after the default opening meeting.
crons.cron(
	"start the week reminder",
	"30 6 * * 1",
	internal.email.mondayReminders,
	{},
);

export default crons;
