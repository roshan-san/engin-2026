import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { Button } from "~/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import {
	type PitchValues,
	usePitchEditor,
} from "~/features/teams/startup/workspace/hooks/usePitchEditor";

const SECTIONS: {
	key: Exclude<keyof PitchValues, "techStack">;
	label: string;
	placeholder: string;
}[] = [
	{
		key: "problem",
		label: "Problem",
		placeholder: "What's broken, and for whom?",
	},
	{ key: "solution", label: "Solution", placeholder: "How you fix it." },
	{ key: "product", label: "Product", placeholder: "What exists today." },
	{
		key: "traction",
		label: "Traction",
		placeholder: "Users, revenue, pilots.",
	},
	{ key: "teamBlurb", label: "Team", placeholder: "Who's building it." },
];

/** Founders edit the Pitch sections; members are pointed to the public Pitch. */
export function PitchPage() {
	const pitch = usePitchEditor();

	if (pitch.isLoading) {
		return <PageLoading rows={6} />;
	}

	const publicLink =
		pitch.slug && !pitch.isStealth ? (
			<Button asChild variant="outline" size="sm">
				<Link to="/startup/$slug" params={{ slug: pitch.slug }}>
					View public Pitch
				</Link>
			</Button>
		) : null;

	if (!pitch.isFounder) {
		return (
			<div className="mx-auto w-full max-w-2xl space-y-6">
				<h1 className="text-xl font-semibold">Pitch</h1>
				<EmptyState
					title="Only founders edit the Pitch"
					description={
						pitch.isStealth
							? "This Startup is in stealth, so it has no public Pitch."
							: "See what everyone else sees on the public Pitch."
					}
					action={publicLink}
				/>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-2xl space-y-8">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-xl font-semibold">Pitch</h1>
				{publicLink}
			</div>
			{pitch.isStealth ? (
				<p className="text-sm text-muted-foreground">
					This Startup is in stealth, so nobody sees the public Pitch until you
					turn stealth off in Settings.
				</p>
			) : null}

			<form
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					void pitch.save();
				}}
			>
				<FieldGroup>
					{SECTIONS.map((section) => (
						<Field key={section.key}>
							<FieldLabel htmlFor={`pitch-${section.key}`}>
								{section.label}
							</FieldLabel>
							<Textarea
								id={`pitch-${section.key}`}
								value={pitch.values[section.key]}
								disabled={pitch.isPending}
								onChange={(event) => pitch.set(section.key, event.target.value)}
								placeholder={section.placeholder}
								rows={4}
							/>
						</Field>
					))}
					<Field>
						<FieldLabel htmlFor="pitch-techStack">Tech stack</FieldLabel>
						<Input
							id="pitch-techStack"
							value={pitch.values.techStack}
							disabled={pitch.isPending}
							onChange={(event) => pitch.set("techStack", event.target.value)}
							placeholder="react, convex, go"
							className="h-11"
						/>
						<FieldDescription>
							Separate with commas. Empty sections don't show on the public
							Pitch.
						</FieldDescription>
					</Field>
					<Button
						type="submit"
						disabled={pitch.isPending}
						className="h-11 sm:w-fit"
					>
						{pitch.isPending ? <Spinner /> : null}
						Save Pitch
					</Button>
				</FieldGroup>
			</form>
		</div>
	);
}
