import { HackathonPost } from "../public/HackathonPost";
import { type HackathonDraft, toParticipantsGet } from "./draft";

/** The live preview beside the form: the post as Applicants will see it. */
export function FormPreview({
	startupName,
	draft,
	startsAt,
}: {
	readonly startupName: string;
	readonly draft: HackathonDraft;
	/** Null when the saved start has passed and the Founder hasn't picked a new one. */
	readonly startsAt: number | null;
}) {
	return (
		<aside
			aria-label="Preview"
			className="hidden lg:sticky lg:top-6 lg:block lg:self-start"
		>
			<p className="mb-3 text-xs text-muted-foreground">
				Preview · what Applicants see
			</p>
			<div className="max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-xl border border-border p-6">
				<HackathonPost
					size="preview"
					post={{
						startupName,
						job: draft.job,
						problem: draft.problem,
						cards: draft.cards.map((card) => card.title),
						weeks: draft.weeks,
						startsAt,
						participantsGet:
							toParticipantsGet(
								draft.participantsGet.choice,
								draft.participantsGet.custom,
							) ?? null,
					}}
				/>
			</div>
		</aside>
	);
}
