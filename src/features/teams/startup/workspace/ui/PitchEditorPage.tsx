import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PageLoading } from "~/components/globals/PageLoading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { BuildFrame } from "~/features/app/layout/BuildFrame";
import { usePitchEditor } from "~/features/teams/startup/workspace/hooks/usePitchEditor";

export function PitchEditorPage() {
	const editor = usePitchEditor();

	if (editor.isLoading) {
		return (
			<BuildFrame>
				<PageLoading />
			</BuildFrame>
		);
	}

	if (!editor.startup) {
		return (
			<BuildFrame>
				<p className="py-10 text-muted-foreground">
					Create a startup to build its Pitch.
				</p>
			</BuildFrame>
		);
	}

	if (!editor.isFounder) {
		return (
			<BuildFrame>
				<p className="py-10 text-muted-foreground">
					Only Founders can edit the Pitch.
				</p>
			</BuildFrame>
		);
	}

	const { values } = editor;

	return (
		<BuildFrame>
			<form
				className="max-w-2xl space-y-8 pb-16"
				onSubmit={(event) => {
					event.preventDefault();
					void editor.save();
				}}
			>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold">Pitch</h1>
						<p className="mt-1 text-muted-foreground">
							What visitors see on your public Startup page.
						</p>
					</div>
					<Button asChild variant="outline">
						<Link
							to="/startup/$slug"
							params={{ slug: editor.startup.slug }}
							target="_blank"
						>
							Preview as public
						</Link>
					</Button>
				</div>

				<section className="space-y-4">
					<Field label="Startup name" htmlFor="name">
						<Input
							id="name"
							value={values.name}
							onChange={(event) => editor.setName(event.target.value)}
						/>
					</Field>
					<Field label="Tagline" htmlFor="tagline">
						<Input
							id="tagline"
							value={values.tagline}
							onChange={(event) => editor.setTagline(event.target.value)}
						/>
					</Field>
					<Field label="About" htmlFor="description">
						<Textarea
							id="description"
							rows={4}
							value={values.description}
							onChange={(event) => editor.setDescription(event.target.value)}
						/>
					</Field>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<Field label="Location" htmlFor="location">
							<Input
								id="location"
								value={values.location}
								onChange={(event) => editor.setLocation(event.target.value)}
								placeholder="Remote"
							/>
						</Field>
						<label className="flex items-center gap-2 self-end pb-2 text-sm">
							<input
								type="checkbox"
								checked={values.remote}
								onChange={(event) => editor.setRemote(event.target.checked)}
							/>
							Remote-friendly
						</label>
					</div>
					<Field label="Tech stack" htmlFor="techStack">
						<Input
							id="techStack"
							value={values.techStack}
							onChange={(event) => editor.setTechStack(event.target.value)}
							placeholder="TypeScript, Convex, React"
						/>
					</Field>
				</section>

				<section className="space-y-4">
					<h2 className="text-lg font-semibold">Pitch sections</h2>
					<Field label="Problem" htmlFor="problem">
						<Textarea
							id="problem"
							rows={3}
							value={values.problem}
							onChange={(event) => editor.setProblem(event.target.value)}
						/>
					</Field>
					<Field label="Solution" htmlFor="solution">
						<Textarea
							id="solution"
							rows={3}
							value={values.solution}
							onChange={(event) => editor.setSolution(event.target.value)}
						/>
					</Field>
					<Field label="Product" htmlFor="product">
						<Textarea
							id="product"
							rows={3}
							value={values.product}
							onChange={(event) => editor.setProduct(event.target.value)}
						/>
					</Field>
					<Field label="Traction" htmlFor="traction">
						<Textarea
							id="traction"
							rows={3}
							value={values.traction}
							onChange={(event) => editor.setTraction(event.target.value)}
						/>
					</Field>
					<Field label="Team" htmlFor="teamBlurb">
						<Textarea
							id="teamBlurb"
							rows={3}
							value={values.teamBlurb}
							onChange={(event) => editor.setTeamBlurb(event.target.value)}
						/>
					</Field>
				</section>

				<section className="space-y-4">
					<h2 className="text-lg font-semibold">Links</h2>
					<Field label="Website" htmlFor="website">
						<Input
							id="website"
							value={values.website}
							onChange={(event) => editor.setWebsite(event.target.value)}
						/>
					</Field>
					<Field label="Twitter" htmlFor="twitterUrl">
						<Input
							id="twitterUrl"
							value={values.twitterUrl}
							onChange={(event) => editor.setTwitterUrl(event.target.value)}
						/>
					</Field>
					<Field label="LinkedIn" htmlFor="linkedinUrl">
						<Input
							id="linkedinUrl"
							value={values.linkedinUrl}
							onChange={(event) => editor.setLinkedinUrl(event.target.value)}
						/>
					</Field>
					<Field label="GitHub" htmlFor="githubUrl">
						<Input
							id="githubUrl"
							value={values.githubUrl}
							onChange={(event) => editor.setGithubUrl(event.target.value)}
						/>
					</Field>
				</section>

				<section className="space-y-4">
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={values.isPublic}
							onChange={(event) => editor.setIsPublic(event.target.checked)}
						/>
						Visible on Explore and at /startup/{editor.startup.slug}
					</label>
					<Button type="submit" disabled={editor.isPending}>
						{editor.isPending ? "Saving…" : "Save Pitch"}
					</Button>
				</section>
			</form>
		</BuildFrame>
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
