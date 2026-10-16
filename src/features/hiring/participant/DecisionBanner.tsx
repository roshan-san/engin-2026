import type { Id } from "@convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { decisionTitle } from "./decisionCopy";
import { useKeepPromise } from "./useKeepPromise";

/** The Founder's decision, their note, and the one-tap promise question. */
export function DecisionBanner({
	application,
}: {
	readonly application: {
		readonly applicationId: Id<"applications">;
		readonly decision: "hired" | "not_this_time";
		readonly feedback: string | null;
		readonly promiseAnswered: boolean;
	};
}) {
	const keepPromise = useKeepPromise(application.applicationId);

	return (
		<section
			aria-label="Decision"
			className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border bg-muted/30 px-4 py-3 md:px-6"
		>
			<p className="min-w-0 flex-1 text-sm">
				<span className="font-medium">
					{decisionTitle(application.decision)}
				</span>
				{application.feedback ? (
					<span className="text-muted-foreground"> {application.feedback}</span>
				) : null}
				{application.decision === "hired" ? (
					<> Join from your Invites.</>
				) : null}
			</p>
			{application.promiseAnswered ? (
				<p className="text-sm text-muted-foreground">Thanks.</p>
			) : (
				<div className="flex items-center gap-2">
					<span className="text-sm">
						Did the founder do what they promised?
					</span>
					<Button
						size="sm"
						variant="outline"
						onClick={() => void keepPromise(true)}
					>
						Yes
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => void keepPromise(false)}
					>
						No
					</Button>
				</div>
			)}
		</section>
	);
}
