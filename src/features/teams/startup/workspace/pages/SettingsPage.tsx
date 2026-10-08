import { Page } from "~/components/shared/Page";
import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
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
import {
	STARTUP_CATEGORIES,
	STARTUP_STAGES,
	type StartupStage,
} from "~/features/teams/startup/constants";
import { useStartupSettings } from "~/features/teams/startup/workspace/hooks/useStartupSettings";

const SELECT_CLASS =
	"border-input h-11 w-full rounded-md border bg-transparent px-3 text-sm";

/** Founders edit the Startup's details and stealth mode. */
export function SettingsPage() {
	const settings = useStartupSettings();
	const { values, set, plan } = settings;

	if (settings.isLoading) {
		return (
			<Page>
				<PageLoading rows={6} />
			</Page>
		);
	}

	if (!settings.isFounder) {
		return (
			<>
				<PageHeader width="narrow" title="Settings" />
				<Page width="narrow" className="space-y-6">
					<EmptyState
						title="Only Founders can change settings"
						body="Ask a founder if something about the Startup needs changing."
					/>
				</Page>
			</>
		);
	}

	const links = [
		{ key: "website", label: "Website", placeholder: "https://acme.in" },
		{ key: "twitterUrl", label: "Twitter", placeholder: "https://x.com/acme" },
		{
			key: "linkedinUrl",
			label: "LinkedIn",
			placeholder: "https://linkedin.com/company/acme",
		},
		{
			key: "githubUrl",
			label: "GitHub",
			placeholder: "https://github.com/acme",
		},
	] as const;

	return (
		<>
			<PageHeader width="narrow" title="Settings" />
			<Page width="narrow" className="space-y-6">
				<form
					noValidate
					onSubmit={(event) => {
						event.preventDefault();
						void settings.save();
					}}
				>
					<div className="space-y-8">
						{plan ? (
							<section className="space-y-2">
								<SectionLabel>Plan</SectionLabel>
								<p className="text-sm font-medium">
									{plan.tier === "pro" ? "Pro" : "Free"} plan
								</p>
								<p className="text-sm text-muted-foreground">
									{plan.usage.members} of {plan.limits.members} member slots
									used, counting pending invites and offers.
									{plan.tier === "free" ? (
										<>
											{" "}
											<Link
												to="/pricing"
												className="font-medium text-foreground underline"
											>
												See Pro
											</Link>
										</>
									) : null}
								</p>
							</section>
						) : null}

						<section className="space-y-4">
							<SectionLabel>Details</SectionLabel>
							<FieldGroup className="gap-4">
								<Field>
									<FieldLabel htmlFor="settings-name">Name</FieldLabel>
									<Input
										id="settings-name"
										value={values.name}
										disabled={settings.isPending}
										onChange={(event) => set("name", event.target.value)}
										className="h-11"
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="settings-tagline">Tagline</FieldLabel>
									<Input
										id="settings-tagline"
										value={values.tagline}
										disabled={settings.isPending}
										onChange={(event) => set("tagline", event.target.value)}
										className="h-11"
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="settings-description">
										Description
									</FieldLabel>
									<Textarea
										id="settings-description"
										value={values.description}
										disabled={settings.isPending}
										onChange={(event) => set("description", event.target.value)}
										rows={4}
									/>
								</Field>
								<div className="grid gap-4 sm:grid-cols-2">
									<Field>
										<FieldLabel htmlFor="settings-category">
											Category
										</FieldLabel>
										<select
											id="settings-category"
											value={values.category}
											disabled={settings.isPending}
											onChange={(event) => set("category", event.target.value)}
											className={SELECT_CLASS}
										>
											<option value="">None</option>
											{STARTUP_CATEGORIES.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									</Field>
									<Field>
										<FieldLabel htmlFor="settings-stage">Stage</FieldLabel>
										<select
											id="settings-stage"
											value={values.stage}
											disabled={settings.isPending}
											onChange={(event) =>
												set("stage", event.target.value as StartupStage | "")
											}
											className={SELECT_CLASS}
										>
											{values.stage === "" ? (
												<option value="">None</option>
											) : null}
											{STARTUP_STAGES.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									</Field>
								</div>
							</FieldGroup>
						</section>

						<section className="space-y-4">
							<SectionLabel>Links</SectionLabel>
							<FieldGroup className="gap-4">
								{links.map((link) => (
									<Field key={link.key}>
										<FieldLabel htmlFor={`settings-${link.key}`}>
											{link.label}
										</FieldLabel>
										<Input
											id={`settings-${link.key}`}
											type="url"
											inputMode="url"
											value={values[link.key]}
											disabled={settings.isPending}
											onChange={(event) => set(link.key, event.target.value)}
											placeholder={link.placeholder}
											className="h-11"
										/>
									</Field>
								))}
							</FieldGroup>
						</section>

						<section className="space-y-4">
							<SectionLabel>Where</SectionLabel>
							<FieldGroup className="gap-4">
								<Field>
									<FieldLabel htmlFor="settings-location">Location</FieldLabel>
									<Input
										id="settings-location"
										value={values.location}
										disabled={settings.isPending}
										onChange={(event) => set("location", event.target.value)}
										placeholder="Bengaluru"
										className="h-11"
									/>
								</Field>
								<div className="flex items-center gap-3">
									<Checkbox
										id="settings-remote"
										checked={values.remote}
										onCheckedChange={(checked) =>
											set("remote", checked === true)
										}
										disabled={settings.isPending}
									/>
									<Label
										htmlFor="settings-remote"
										className="text-sm leading-snug font-normal"
									>
										Remote-friendly
									</Label>
								</div>
							</FieldGroup>
						</section>

						<section className="space-y-4">
							<SectionLabel>Visibility</SectionLabel>
							<div className="flex items-start gap-3">
								<Checkbox
									id="settings-stealth"
									checked={values.stealth}
									onCheckedChange={(checked) =>
										set("stealth", checked === true)
									}
									disabled={settings.isPending}
									className="mt-0.5"
								/>
								<div className="space-y-1">
									<Label
										htmlFor="settings-stealth"
										className="text-sm leading-snug font-normal"
									>
										Stealth mode
									</Label>
									<FieldDescription>
										Hides the public Pitch and Explore listing. Stealth Startups
										can't publish hackathons.
										{plan?.tier === "free" ? (
											<>
												{" "}
												Pro only.{" "}
												<Link to="/pricing" className="underline">
													See Pro
												</Link>
											</>
										) : null}
									</FieldDescription>
								</div>
							</div>
						</section>

						<FormFooter>
							{settings.slug && !values.stealth ? (
								<Button
									asChild
									variant="outline"
									className="h-11 max-md:flex-1"
								>
									<Link to="/startup/$slug" params={{ slug: settings.slug }}>
										View public Pitch
									</Link>
								</Button>
							) : null}
							<Button
								type="submit"
								disabled={settings.isPending}
								className="h-11 max-md:flex-1"
							>
								{settings.isPending ? <Spinner /> : null}
								Save settings
							</Button>
						</FormFooter>
					</div>
				</form>
			</Page>
		</>
	);
}
