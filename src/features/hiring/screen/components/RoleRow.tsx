import type { Doc } from "@convex/_generated/dataModel";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { ROLE_TYPES } from "~/features/hiring/roles/constants";
import { cn } from "~/lib/utils";

type RoleRowProps = {
	readonly role: Doc<"roles">;
	readonly isFounder: boolean;
	readonly isClosing: boolean;
	readonly onClose: () => void;
};

export function RoleRow({ role, isFounder, isClosing, onClose }: RoleRowProps) {
	const isOpen = role.status === "open";
	const typeLabel =
		ROLE_TYPES.find((type) => type.value === role.type)?.label ?? role.type;

	return (
		<li
			className={cn(
				"flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
				!isOpen && "text-muted-foreground opacity-70",
			)}
		>
			<div className="min-w-0 space-y-1">
				<p className="truncate font-medium">{role.title}</p>
				<p className="text-sm text-muted-foreground">
					{typeLabel} · {role.headcount} to hire
				</p>
				{role.skills.length > 0 ? (
					<div className="flex flex-wrap gap-1">
						{role.skills.map((skill) => (
							<Badge key={skill} variant="outline">
								{skill}
							</Badge>
						))}
					</div>
				) : null}
			</div>

			{isOpen ? (
				isFounder ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="shrink-0 self-start sm:self-auto"
						disabled={isClosing}
						onClick={onClose}
					>
						{isClosing ? <Spinner /> : null}
						Close
					</Button>
				) : null
			) : (
				<Badge variant="secondary" className="self-start sm:self-auto">
					Closed
				</Badge>
			)}
		</li>
	);
}
