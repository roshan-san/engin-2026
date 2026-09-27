import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { PageLoading } from "~/components/globals/PageLoading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useWorkspace } from "~/features/app/hooks/useWorkspace";
import { fromDateInput } from "~/lib/dates";
import { toErrorMessage } from "~/lib/validation";

export function CreateTrialPage() {
	const navigate = useNavigate();
	const { active, isLoading } = useWorkspace();
	const roles = useQuery(
		api.hiring.roles.list,
		active ? { startupId: active.startup._id } : "skip",
	);
	const createTrial = useMutation(api.hiring.trialCycles.create);
	const [roleId, setRoleId] = useState("");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [admission, setAdmission] = useState<"open" | "application">(
		"application",
	);
	const [maxContributors, setMaxContributors] = useState("6");
	const [startsAt, setStartsAt] = useState("");
	const [endsAt, setEndsAt] = useState("");
	const [expectedOutcome, setExpectedOutcome] = useState("");
	const [isPending, setIsPending] = useState(false);

	if (isLoading) {
		return <PageLoading />;
	}

	const workspace = active?.role === "founder" ? active : null;
	if (!workspace) {
		return (
			<p className="py-10 text-muted-foreground">
				Only founders can launch Trial Cycles.
			</p>
		);
	}

	const startupId = workspace.startup._id;
	const openRoles = roles?.filter((role) => role.status === "open") ?? [];

	async function submit() {
		if (!roleId) {
			toast.error("Choose a Role first");
			return;
		}
		setIsPending(true);
		try {
			const trialCycleId = await createTrial({
				startupId,
				roleId: roleId as Id<"roles">,
				title,
				description,
				admission,
				maxContributors: Number(maxContributors),
				startsAt: fromDateInput(startsAt),
				endsAt: fromDateInput(endsAt),
				expectedOutcome: expectedOutcome || undefined,
			});
			toast.success("Trial Cycle opened");
			await navigate({
				to: "/app/trials/$trialCycleId",
				params: { trialCycleId },
			});
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not create Trial Cycle"));
		} finally {
			setIsPending(false);
		}
	}

	return (
		<div className="mx-auto w-full max-w-xl space-y-6 py-8">
			<div>
				<Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
					<Link to="/app/trials">Back to Trials</Link>
				</Button>
				<h1 className="text-2xl font-bold">Launch a Trial Cycle</h1>
				<p className="mt-1 text-muted-foreground">
					Evaluate people through real Pulses before they join the team.
				</p>
			</div>
			{openRoles.length === 0 ? (
				<div className="space-y-3">
					<p className="text-sm text-muted-foreground">
						Post a Role first, then attach a Trial Cycle to it.
					</p>
					<Button asChild>
						<Link to="/app/startup/roles/new">Post a Role</Link>
					</Button>
				</div>
			) : (
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						void submit();
					}}
				>
					<div className="space-y-2">
						<Label htmlFor="role">Role</Label>
						<select
							id="role"
							required
							value={roleId}
							onChange={(event) => setRoleId(event.target.value)}
							className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
						>
							<option value="">Select a Role</option>
							{openRoles.map((role) => (
								<option key={role._id} value={role._id}>
									{role.title}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							required
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder="Backend Engineer Trial Cycle"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							required
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							rows={4}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="admission">Admission</Label>
						<select
							id="admission"
							value={admission}
							onChange={(event) =>
								setAdmission(event.target.value as "open" | "application")
							}
							className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
						>
							<option value="application">Application</option>
							<option value="open">Open join until full</option>
						</select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="max">Max contributors</Label>
						<Input
							id="max"
							type="number"
							min={1}
							max={10}
							value={maxContributors}
							onChange={(event) => setMaxContributors(event.target.value)}
						/>
					</div>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="start">Starts</Label>
							<Input
								id="start"
								type="date"
								required
								value={startsAt}
								onChange={(event) => setStartsAt(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="end">Ends</Label>
							<Input
								id="end"
								type="date"
								required
								value={endsAt}
								onChange={(event) => setEndsAt(event.target.value)}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="outcome">Expected outcome</Label>
						<Textarea
							id="outcome"
							value={expectedOutcome}
							onChange={(event) => setExpectedOutcome(event.target.value)}
							rows={3}
						/>
					</div>
					<Button type="submit" disabled={isPending}>
						{isPending ? "Opening…" : "Open Trial Cycle"}
					</Button>
				</form>
			)}
		</div>
	);
}
