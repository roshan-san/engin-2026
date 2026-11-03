import { useState } from "react";
import { toast } from "sonner";
import { useCycle } from "~/entities/cycle";
import { useWorkspace } from "~/entities/startup";
import { MeetingsDialog } from "~/features/set-meetings";
import { Button } from "~/shared/ui/button";

function copyEmail(email: string) {
	navigator.clipboard
		.writeText(email)
		.then(() => toast("Email copied"))
		.catch(() => toast(email));
}

/** Above the Board: a team without meetings sets them; the Founder adds new people to them. */
export function MeetingsNotice() {
	const { startup, isFounder } = useWorkspace();
	const cycle = useCycle(startup._id);
	const [isEditing, setIsEditing] = useState(false);

	if (!cycle || cycle.isSolo) {
		return null;
	}

	if (!cycle.meetings) {
		return (
			<div className="flex items-center gap-3 border-b border-border px-4 py-2 text-sm">
				<span>Set your two weekly meetings</span>
				{isFounder ? (
					<>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setIsEditing(true)}
						>
							Set meetings
						</Button>
						<MeetingsDialog open={isEditing} onOpenChange={setIsEditing} />
					</>
				) : null}
			</div>
		);
	}

	const uninvited = cycle.uninvited ?? [];
	if (uninvited.length === 0) {
		return null;
	}
	return (
		<ul className="flex flex-col gap-1 border-b border-border px-4 py-2 text-sm">
			{uninvited.map((email) => (
				<li key={email} className="flex items-center gap-3">
					<span className="min-w-0 truncate">Add {email} to your meetings</span>
					<Button
						size="sm"
						variant="ghost"
						className="h-6 px-1.5 text-xs"
						onClick={() => copyEmail(email)}
					>
						Copy
					</Button>
				</li>
			))}
		</ul>
	);
}
