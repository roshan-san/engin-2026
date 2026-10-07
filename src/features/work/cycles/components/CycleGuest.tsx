import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { useMyWork } from "~/features/work/cycles/hooks/useMyWork";

export function CycleGuest() {
	const { tasks, applications, isLoading } = useMyWork();
	const hackathons =
		applications?.filter(
			(item) => item.hackathonId !== null && item.status === "accepted",
		) ?? [];
	const activeTasks =
		tasks?.filter((task) => task.status === "in_progress") ?? [];

	return (
		<div className="mx-auto w-full max-w-3xl space-y-8 py-10">
			<div className="space-y-3">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					You&apos;re not on a startup yet
				</h1>
				<p className="max-w-lg text-muted-foreground">
					Join a Hackathon to prove work, or create a Startup and run Build from
					the inside.
				</p>
			</div>

			{isLoading ? (
				<p className="text-sm text-muted-foreground">Loading your work…</p>
			) : null}

			{hackathons.length > 0 ? (
				<section className="space-y-3">
					<h2 className="text-sm font-medium text-muted-foreground">
						Hackathons
					</h2>
					<ul className="space-y-2">
						{hackathons.map((item) => {
							const hackathonId = item.hackathonId;
							if (!hackathonId) {
								return null;
							}
							return (
								<li key={item._id}>
									<Link
										to="/s/$slug/hackathons/$hackathonId"
										params={{ slug: item.startupSlug, hackathonId }}
										className="block rounded-xl border border-border p-4 hover:bg-muted/30"
									>
										<p className="font-medium">{item.hackathonTitle}</p>
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

			{activeTasks.length > 0 ? (
				<section className="space-y-3">
					<h2 className="text-sm font-medium text-muted-foreground">
						Your Tasks
					</h2>
					<ul className="space-y-2">
						{activeTasks.map((task) => (
							<li
								key={task._id}
								className="rounded-xl border border-border p-4"
							>
								<p className="font-medium">{task.title}</p>
								<p className="mt-1 text-sm text-muted-foreground">
									{task.startupName}
								</p>
							</li>
						))}
					</ul>
				</section>
			) : null}

			<div className="flex flex-col gap-2 sm:flex-row">
				<Button asChild className="h-11">
					<Link to="/discover">Find a Hackathon</Link>
				</Button>
				<Button asChild variant="ghost" className="h-11">
					<Link to="/startups/new">Create a Startup</Link>
				</Button>
			</div>
		</div>
	);
}
