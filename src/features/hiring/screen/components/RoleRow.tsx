import type { Doc } from "@convex/_generated/dataModel";
import { Row } from "~/components/shared/RowList";
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
		<Row
			className={cn(!isOpen && "opacity-70")}
			title={role.title}
			meta={[
				typeLabel,
				`${role.headcount} to hire`,
				...(role.skills.length > 0 ? [role.skills.join(", ")] : []),
			].join(" · ")}
			trailing={
				isOpen ? (
					isFounder ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isClosing}
							onClick={onClose}
						>
							{isClosing ? <Spinner /> : null}
							Close
						</Button>
					) : null
				) : (
					"Closed"
				)
			}
		/>
	);
}
