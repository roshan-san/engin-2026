import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/shared/ui/button";
import { Spinner } from "~/shared/ui/spinner";
import { decisionTitle } from "./decisionCopy";
import { useKeepPromise } from "./useKeepPromise";

/** The Founder's decision, their note, and the one-tap promise question. */
export function DecisionBanner({
	startupName,
	application,
}: {
	readonly startupName: string;
	readonly application: {
		readonly applicationId: Id<"applications">;
		readonly decision: "hired" | "not_this_time";
		readonly feedback: string | null;
		readonly promiseAnswered: boolean;
	};
}) {
	const keepPromise = useKeepPromise(application.applicationId);
	const [saving, setSaving] = useState<boolean | null>(null);

	async function answer(kept: boolean) {
		setSaving(kept);
		await keepPromise(kept);
		setSaving(null);
	}

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
					<>
						{" "}
						<Link
							to="/home"
							className="underline underline-offset-2 hover:text-foreground focus-ring"
						>
							Join {startupName} from Home
						</Link>
						.
					</>
				) : null}
			</p>
			{application.promiseAnswered ? (
				<p className="text-sm text-muted-foreground">Thanks.</p>
			) : (
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-sm">
						Did the Founder do what they promised?
					</span>
					<Button
						size="sm"
						variant="outline"
						disabled={saving !== null}
						onClick={() => void answer(true)}
					>
						{saving === true ? <Spinner /> : null}
						Yes
					</Button>
					<Button
						size="sm"
						variant="outline"
						disabled={saving !== null}
						onClick={() => void answer(false)}
					>
						{saving === false ? <Spinner /> : null}
						No
					</Button>
				</div>
			)}
		</section>
	);
}
