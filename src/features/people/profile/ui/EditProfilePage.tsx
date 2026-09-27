import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { ScoreEvidenceCard } from "~/features/people/profile/components/ScoreEvidence";
import { useProfileEditor } from "~/features/people/profile/hooks/useProfileEditor";

export function EditProfilePage() {
	const editor = useProfileEditor();

	if (editor.isLoading || !editor.user) {
		return <PageLoading />;
	}

	const { values } = editor;
	const publicHref = values.username ? `/@${values.username}` : null;

	return (
		<div className="mx-auto w-full max-w-2xl space-y-8 py-8">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold sm:text-3xl">Profile</h1>
					<p className="mt-1 text-muted-foreground">
						Your verified startup work identity. Everything here is optional.
					</p>
				</div>
				{publicHref ? (
					<Button asChild variant="outline">
						<Link to="/u/$username" params={{ username: values.username }}>
							View public profile
						</Link>
					</Button>
				) : null}
			</div>

			{editor.user.evidence ? (
				<ScoreEvidenceCard evidence={editor.user.evidence} />
			) : null}

			<form
				className="space-y-5"
				onSubmit={(event) => {
					event.preventDefault();
					void editor.save();
				}}
			>
				<Field label="Name" htmlFor="name">
					<Input
						id="name"
						value={values.name}
						onChange={(event) => editor.setName(event.target.value)}
						placeholder="Your name"
					/>
				</Field>
				<Field label="Username" htmlFor="username">
					<Input
						id="username"
						value={values.username}
						onChange={(event) => editor.setUsername(event.target.value)}
						placeholder="roshan"
					/>
					<p className="text-xs text-muted-foreground">
						Public URL: /u/{values.username || "username"}
					</p>
				</Field>
				<Field label="Headline" htmlFor="headline">
					<Input
						id="headline"
						value={values.headline}
						onChange={(event) => editor.setHeadline(event.target.value)}
						placeholder="Backend engineer · looking for a founding role"
					/>
				</Field>
				<Field label="Bio" htmlFor="bio">
					<Textarea
						id="bio"
						value={values.bio}
						onChange={(event) => editor.setBio(event.target.value)}
						placeholder="Short bio"
						rows={4}
					/>
				</Field>
				<Field label="Skills" htmlFor="skills">
					<Input
						id="skills"
						value={values.skills}
						onChange={(event) => editor.setSkills(event.target.value)}
						placeholder="TypeScript, product, growth"
					/>
					<p className="text-xs text-muted-foreground">Comma-separated</p>
				</Field>
				<Field label="Location" htmlFor="location">
					<Input
						id="location"
						value={values.location}
						onChange={(event) => editor.setLocation(event.target.value)}
						placeholder="Berlin"
					/>
				</Field>
				<Field label="GitHub" htmlFor="github">
					<Input
						id="github"
						value={values.githubUrl}
						onChange={(event) => editor.setGithubUrl(event.target.value)}
						placeholder="https://github.com/you"
					/>
				</Field>
				<Field label="LinkedIn" htmlFor="linkedin">
					<Input
						id="linkedin"
						value={values.linkedinUrl}
						onChange={(event) => editor.setLinkedinUrl(event.target.value)}
						placeholder="https://linkedin.com/in/you"
					/>
				</Field>
				<Field label="Portfolio" htmlFor="portfolio">
					<Input
						id="portfolio"
						value={values.portfolioUrl}
						onChange={(event) => editor.setPortfolioUrl(event.target.value)}
						placeholder="https://"
					/>
				</Field>
				<Button type="submit" disabled={editor.isPending}>
					{editor.isPending ? "Saving…" : "Save profile"}
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
	readonly children: React.ReactNode;
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor={htmlFor}>{label}</Label>
			{children}
		</div>
	);
}
