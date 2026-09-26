import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { useMyWork } from "~/features/work/hooks/useMyWork";

export function CycleGuest() {
	const { pulses, applications, isLoading } = useMyWork();
	const trials =
		applications?.filter(
			(item) => item.trialCycleId !== null && item.status === "joined",
		) ?? [];
	const activePulses =
		pulses?.filter((pulse) => pulse.status === "in_progress") ?? [];

	return (
		<div className="mx-auto w-full max-w-3xl space-y-8 py-10">
			<div className="space-y-3">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					You&apos;re not on a startup yet
				</h1>
				<p className="max-w-lg text-muted-foreground">
					Join a Trial Cycle to prove work, or create a startup and run Build
					from the inside.
				</p>
			</div>

			{isLoading ? (
				<p className="text-sm text-muted-foreground">Loading your work…</p>
			) : null}

			{trials.length > 0 ? (
				<section className="space-y-3">
					<h2 className="text-sm font-medium text-muted-foreground">
						Trial Cycles
					</h2>
					<ul className="space-y-2">
						{trials.map((item) => {
							const trialCycleId = item.trialCycleId;
							if (!trialCycleId) {
								return null;
							}
							return (
								<li key={item._id}>
									<Link
										to="/app/trials/$trialCycleId"
										params={{ trialCycleId }}
										className="block rounded-xl border border-border p-4 hover:bg-muted/30"
									>
										<p className="font-medium">{item.trialTitle}</p>
										<p className="mt-1 text-sm text-muted-foreground">
											{item.startupName}
										</p>
									</Link>
								</li>
							);
						})}
					</ul>
				</section>
			) : null}

			{activePulses.length > 0 ? (
				<section className="space-y-3">
					<h2 className="text-sm font-medium text-muted-foreground">
						Your Pulses
					</h2>
					<ul className="space-y-2">
						{activePulses.map((pulse) => (
							<li
								key={pulse._id}
								className="rounded-xl border border-border p-4"
							>
								<p className="font-medium">{pulse.title}</p>
								<p className="mt-1 text-sm text-muted-foreground">
									{pulse.startupName}
								</p>
							</li>
						))}
					</ul>
				</section>
			) : null}

			<div className="flex flex-col gap-2 sm:flex-row">
				<Button asChild className="h-11">
					<Link to="/app/opportunities">Find Opportunities</Link>
				</Button>
				<Button asChild variant="outline" className="h-11">
					<Link to="/app/explore">Explore startups</Link>
				</Button>
				<Button asChild variant="ghost" className="h-11">
					<Link to="/app/startups/new">Create a startup</Link>
				</Button>
			</div>
		</div>
	);
}
