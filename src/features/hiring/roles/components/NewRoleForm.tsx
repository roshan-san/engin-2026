import type { Id } from "@convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { ROLE_TYPES } from "~/features/hiring/roles/constants";
import { useNewRoleForm } from "~/features/hiring/roles/hooks/useNewRoleForm";

type NewRoleFormProps = {
	readonly startupId: Id<"startups">;
	readonly onCreated: (roleId: Id<"roles">) => void;
	/** Hidden when there's no open Role to fall back to. */
	readonly onCancel?: () => void;
};

/**
 * Lives inside the hackathon form, so it is not a <form> itself: its buttons
 * never submit the hackathon.
 */
export function NewRoleForm({
	startupId,
	onCreated,
	onCancel,
}: NewRoleFormProps) {
	const { values, setField, isPending, submit } = useNewRoleForm(
		startupId,
		onCreated,
	);

	return (
		<FieldSet className="rounded-lg border p-4">
			<FieldLegend variant="label">New Role</FieldLegend>
			<FieldGroup className="gap-4">
				<Field>
					<FieldLabel htmlFor="role-title">Title</FieldLabel>
					<Input
						id="role-title"
						value={values.title}
						disabled={isPending}
						onChange={(event) => setField("title", event.target.value)}
						placeholder="Full-stack builder"
						className="h-11"
					/>
				</Field>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Field>
						<FieldLabel htmlFor="role-type">Type</FieldLabel>
						<Select
							value={values.type}
							disabled={isPending}
							onValueChange={(type) => setField("type", type)}
						>
							<SelectTrigger id="role-type" className="h-11 w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ROLE_TYPES.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
					<Field>
						<FieldLabel htmlFor="role-headcount">Headcount</FieldLabel>
						<Input
							id="role-headcount"
							type="number"
							inputMode="numeric"
							min={1}
							value={values.headcount}
							disabled={isPending}
							onChange={(event) => setField("headcount", event.target.value)}
							className="h-11"
						/>
					</Field>
				</div>
				<Field>
					<FieldLabel htmlFor="role-skills">Skills</FieldLabel>
					<Input
						id="role-skills"
						value={values.skills}
						disabled={isPending}
						onChange={(event) => setField("skills", event.target.value)}
						placeholder="TypeScript, React"
						className="h-11"
					/>
					<FieldDescription>Separate skills with commas.</FieldDescription>
				</Field>
				<Field>
					<FieldLabel htmlFor="role-description">Short description</FieldLabel>
					<Textarea
						id="role-description"
						value={values.description}
						disabled={isPending}
						onChange={(event) => setField("description", event.target.value)}
						rows={3}
					/>
				</Field>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						disabled={isPending}
						onClick={() => void submit()}
					>
						{isPending ? <Spinner /> : null}
						Create Role
					</Button>
					{onCancel ? (
						<Button
							type="button"
							variant="ghost"
							disabled={isPending}
							onClick={onCancel}
						>
							Cancel
						</Button>
					) : null}
				</div>
			</FieldGroup>
		</FieldSet>
	);
}
