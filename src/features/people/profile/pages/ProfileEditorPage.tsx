import { Page } from "~/components/shared/Page";
import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { FormFooter } from "~/components/shared/FormFooter";
import { PageHeader } from "~/components/shared/PageHeader";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { ProfileEvaluations } from "~/features/people/profile/components/ProfileEvaluations";
import { useProfileEditor } from "~/features/people/profile/hooks/useProfileEditor";
import { useUsernameAvailability } from "~/features/people/profile/hooks/useUsernameAvailability";

export function ProfileEditorPage() {
	const editor = useProfileEditor();
	const { values } = editor;
	const savedUsername = editor.user?.username ?? null;
	const { available } = useUsernameAvailability(values.username, savedUsername);

	if (editor.isLoading) {
		return <PageLoading rows={6} />;
	}

	const links = [
		{
			id: "profile-github",
			label: "GitHub",
			value: values.githubUrl,
			onChange: editor.setGithubUrl,
			placeholder: "https://github.com/you",
		},
		{
			id: "profile-linkedin",
			label: "LinkedIn",
			value: values.linkedinUrl,
			onChange: editor.setLinkedinUrl,
			placeholder: "https://linkedin.com/in/you",
		},
		{
			id: "profile-portfolio",
			label: "Portfolio",
			value: values.portfolioUrl,
			onChange: editor.setPortfolioUrl,
			placeholder: "https://you.dev",
		},
	];

	return (
		<>
			<PageHeader
				width="narrow"
				title="Edit profile"
				actions={
					savedUsername ? (
						<Button asChild variant="outline" size="sm">
							<Link to="/u/$username" params={{ username: savedUsername }}>
								View public profile
							</Link>
						</Button>
					) : null
				}
			/>
			<Page width="narrow" className="space-y-8">
				{savedUsername ? null : (
					<p className="-mt-4 text-sm text-muted-foreground">
						Set a username to get a public profile that shows your Score and
						verdicts.
					</p>
				)}

				<form
					noValidate
					onSubmit={(event) => {
						event.preventDefault();
						void editor.save();
					}}
				>
					<div className="space-y-8">
						<section className="space-y-4">
							<SectionLabel>About you</SectionLabel>
							<FieldGroup className="gap-4">
								<Field>
									<FieldLabel htmlFor="profile-name">Name</FieldLabel>
									<Input
										id="profile-name"
										value={values.name}
										disabled={editor.isPending}
										onChange={(event) => editor.setName(event.target.value)}
										className="h-11"
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="profile-username">Username</FieldLabel>
									<Input
										id="profile-username"
										value={values.username}
										disabled={editor.isPending}
										onChange={(event) => editor.setUsername(event.target.value)}
										autoCapitalize="none"
										autoComplete="off"
										spellCheck={false}
										className="h-11"
									/>
									{available === undefined ? null : (
										<FieldDescription>
											{available ? "Available" : "Not available"}
										</FieldDescription>
									)}
								</Field>
								<Field>
									<FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
									<Textarea
										id="profile-bio"
										value={values.bio}
										disabled={editor.isPending}
										onChange={(event) => editor.setBio(event.target.value)}
										rows={4}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="profile-skills">Skills</FieldLabel>
									<Input
										id="profile-skills"
										value={values.skills}
										disabled={editor.isPending}
										onChange={(event) => editor.setSkills(event.target.value)}
										placeholder="react, go, postgres"
										className="h-11"
									/>
									<FieldDescription>
										Separate skills with commas.
									</FieldDescription>
								</Field>
								<Field>
									<FieldLabel htmlFor="profile-location">Location</FieldLabel>
									<Input
										id="profile-location"
										value={values.location}
										disabled={editor.isPending}
										onChange={(event) => editor.setLocation(event.target.value)}
										placeholder="Chennai"
										className="h-11"
									/>
								</Field>
							</FieldGroup>
						</section>

						<section className="space-y-4">
							<SectionLabel>Links</SectionLabel>
							<FieldGroup className="gap-4">
								{links.map((link) => (
									<Field key={link.id}>
										<FieldLabel htmlFor={link.id}>{link.label}</FieldLabel>
										<Input
											id={link.id}
											type="url"
											inputMode="url"
											value={link.value}
											disabled={editor.isPending}
											onChange={(event) => link.onChange(event.target.value)}
											placeholder={link.placeholder}
											className="h-11"
										/>
									</Field>
								))}
							</FieldGroup>
						</section>

						<section className="space-y-4">
							<SectionLabel>Visibility</SectionLabel>
							<div className="flex items-center gap-3">
								<Checkbox
									id="profile-hide-from-explore"
									checked={values.hideFromExplore}
									onCheckedChange={(checked) =>
										editor.setHideFromExplore(checked === true)
									}
									disabled={editor.isPending}
								/>
								<Label
									htmlFor="profile-hide-from-explore"
									className="text-sm leading-snug font-normal"
								>
									Hide me from Explore
								</Label>
							</div>
						</section>

						<FormFooter>
							<Button
								type="submit"
								disabled={editor.isPending}
								className="h-11 max-md:flex-1"
							>
								{editor.isPending ? <Spinner /> : null}
								Save profile
							</Button>
						</FormFooter>
					</div>
				</form>

				<ProfileEvaluations />
			</Page>
		</>
	);
}
