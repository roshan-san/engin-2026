import { api } from "@convex/_generated/api";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { PageLoading } from "~/components/globals/PageLoading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useWorkspace } from "~/features/app/hooks/useWorkspace";
import { ROLE_TYPES } from "~/features/hiring/roles/constants";
import { toErrorMessage } from "~/lib/validation";

export function CreateRolePage() {
	const navigate = useNavigate();
	const { active, isLoading } = useWorkspace();
	const createRole = useMutation(api.hiring.roles.create);
	const [title, setTitle] = useState("");
	const [type, setType] = useState<(typeof ROLE_TYPES)[number]["value"]>(
		ROLE_TYPES[0].value,
	);
	const [skills, setSkills] = useState("");
	const [description, setDescription] = useState("");
	const [compensation, setCompensation] = useState("");
	const [location, setLocation] = useState("");
	const [remote, setRemote] = useState(true);
	const [headcount, setHeadcount] = useState("1");
	const [isPending, setIsPending] = useState(false);

	if (isLoading) {
		return <PageLoading />;
	}

	const workspace = active?.role === "founder" ? active : null;
	if (!workspace) {
		return (
			<p className="py-10 text-muted-foreground">
				Only founders can post Roles.
			</p>
		);
	}

	const startupId = workspace.startup._id;

	async function submit() {
		setIsPending(true);
		try {
			await createRole({
				startupId,
				title,
				type,
				skills: skills.split(",").map((skill) => skill.trim()),
				description,
				compensation: compensation || undefined,
				location: location || undefined,
				remote,
				headcount: Number(headcount),
			});
			toast.success("Role posted");
			await navigate({ to: "/app/trials" });
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not post Role"));
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
				<h1 className="text-2xl font-bold">Post a Role</h1>
				<p className="mt-1 text-muted-foreground">
					Keep it short. People will apply from their Engin profile.
				</p>
			</div>
			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					void submit();
				}}
			>
				<Field label="Title" htmlFor="title">
					<Input
						id="title"
						required
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder="Founding designer"
					/>
				</Field>
				<Field label="Type" htmlFor="type">
					<select
						id="type"
						value={type}
						onChange={(event) =>
							setType(
								event.target.value as (typeof ROLE_TYPES)[number]["value"],
							)
						}
						className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
					>
						{ROLE_TYPES.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
				</Field>
				<Field label="Skills" htmlFor="skills">
					<Input
						id="skills"
						value={skills}
						onChange={(event) => setSkills(event.target.value)}
						placeholder="Figma, product, research"
					/>
				</Field>
				<Field label="Description" htmlFor="description">
					<Textarea
						id="description"
						required
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						rows={5}
					/>
				</Field>
				<Field label="Headcount" htmlFor="headcount">
					<Input
						id="headcount"
						type="number"
						min={1}
						step={1}
						required
						value={headcount}
						onChange={(event) => setHeadcount(event.target.value)}
					/>
				</Field>
				<Field label="Compensation" htmlFor="compensation">
					<Input
						id="compensation"
						value={compensation}
						onChange={(event) => setCompensation(event.target.value)}
						placeholder="Optional"
					/>
				</Field>
				<Field label="Location" htmlFor="location">
					<Input
						id="location"
						value={location}
						onChange={(event) => setLocation(event.target.value)}
						placeholder="Remote"
					/>
				</Field>
				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={remote}
						onChange={(event) => setRemote(event.target.checked)}
					/>
					Remote
				</label>
				<Button type="submit" disabled={isPending}>
					{isPending ? "Posting…" : "Post Role"}
				</Button>
			</form>
		</div>
	);
}

function Field({
	label,
	htmlFor,
	children,
}: {
	readonly label: string;
	readonly htmlFor: string;
	readonly children: ReactNode;
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor={htmlFor}>{label}</Label>
			{children}
		</div>
	);
}
