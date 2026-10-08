import type { Id } from "@convex/_generated/dataModel";
import { FormFooter } from "~/components/shared/FormFooter";
import { PageHeader } from "~/components/shared/PageHeader";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { useInviteTeamStep } from "~/features/teams/startup/public/hooks/useInviteTeamStep";

type InviteTeamStepProps = {
	readonly startupId: Id<"startups">;
	readonly startupName: string;
	readonly onDone: () => void;
};

/** After the Startup exists: invite up to five people, or skip for now. */
export function InviteTeamStep({
	startupId,
	startupName,
	onDone,
}: InviteTeamStepProps) {
	const { rows, setRow, hasAny, isPending, sendInvites } = useInviteTeamStep(
		startupId,
		onDone,
	);

	return (
		<form
			className="space-y-8"
			onSubmit={(event) => {
				event.preventDefault();
				void sendInvites();
			}}
		>
			<PageHeader
				embedded
				title="Invite your team"
				meta={`${startupName} is live. Add people by email or @username; they join as Members.`}
			/>

			<div className="space-y-2">
				{rows.map((row, index) => (
					<Input
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length rows
						key={index}
						aria-label={`Teammate ${index + 1}`}
						value={row}
						disabled={isPending}
						onChange={(event) => setRow(index, event.target.value)}
						placeholder={index === 0 ? "teammate@email.com" : undefined}
						className="h-11"
					/>
				))}
			</div>

			<FormFooter>
				<Button
					type="button"
					variant="ghost"
					className="h-11 text-muted-foreground"
					disabled={isPending}
					onClick={onDone}
				>
					Skip for now
				</Button>
				<Button
					type="submit"
					className="h-11 max-md:flex-1"
					disabled={!hasAny || isPending}
				>
					{isPending ? <Spinner /> : null}
					Send invites
				</Button>
			</FormFooter>
		</form>
	);
}
