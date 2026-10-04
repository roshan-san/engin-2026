import type { Id } from "@convex/_generated/dataModel";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useRoles } from "~/features/hiring/roles/hooks/useRoles";
import { roleSchema } from "~/features/hiring/roles/schemas/role";
import { toErrorMessage, validate } from "~/lib/validation";

export type NewRoleValues = {
	readonly title: string;
	readonly type: string;
	readonly skills: string;
	readonly description: string;
	readonly headcount: string;
};

const EMPTY_ROLE: NewRoleValues = {
	title: "",
	type: "engineering",
	skills: "",
	description: "",
	headcount: "1",
};

/** The inline "+ New Role" form: creates an open Role and hands back its id. */
export function useNewRoleForm(
	startupId: Id<"startups">,
	onCreated: (roleId: Id<"roles">) => void,
) {
	const { createRole } = useRoles(startupId);
	const [values, setValues] = useState<NewRoleValues>(EMPTY_ROLE);
	const [isPending, setIsPending] = useState(false);
	const pendingRef = useRef(false);

	function setField<Key extends keyof NewRoleValues>(
		key: Key,
		value: NewRoleValues[Key],
	) {
		setValues((current) => ({ ...current, [key]: value }));
	}

	async function submit() {
		if (pendingRef.current) {
			return;
		}
		const parsed = validate(roleSchema, values);
		if (!parsed.ok) {
			toast.error(parsed.message);
			return;
		}

		pendingRef.current = true;
		setIsPending(true);
		try {
			const roleId = await createRole({ startupId, ...parsed.data });
			setValues(EMPTY_ROLE);
			toast.success("Role created");
			onCreated(roleId);
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not create the Role"));
		} finally {
			pendingRef.current = false;
			setIsPending(false);
		}
	}

	return { values, setField, isPending, submit };
}
