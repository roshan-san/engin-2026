import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { BuildFrame } from "~/features/app/layout/BuildFrame";
import { MemberList } from "~/features/team/components/MemberList";
import { useTeamInvites } from "~/features/team/hooks/useTeamInvites";

export function TeamPage() {
	return (
		<BuildFrame>
			<TeamView />
		</BuildFrame>
	);
}

function TeamView() {
	const {
		startup,
		members,
		invites,
		email,
		setEmail,
		isPending,
		submitInvite,
	} = useTeamInvites();

	if (!startup) {
		return null;
	}

	const isFounder = startup.role === "founder";
	const pendingInvites = invites?.filter(
		(invite) => invite.status === "pending",
	);

	return (
		<div className="space-y-10">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2">
					<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
						Team
					</h1>
					<p className="text-muted-foreground">
						People already inside {startup.startup.name}.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link to="/startup/$slug" params={{ slug: startup.startup.slug }}>
						Public page
					</Link>
				</Button>
			</div>

			<MemberList members={members ?? []} />

			{isFounder ? (
				<section className="space-y-4">
					<h2 className="text-sm font-medium text-muted-foreground">Invite</h2>
					<form
						onSubmit={submitInvite}
						className="flex flex-col gap-2 sm:flex-row"
					>
						<Input
							type="email"
							required
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="teammate@email.com"
							className="h-11 flex-1"
						/>
						<Button type="submit" disabled={isPending} className="h-11">
							{isPending ? "Sending…" : "Send invite"}
						</Button>
					</form>
					{pendingInvites && pendingInvites.length > 0 ? (
						<ul className="space-y-2">
							{pendingInvites.map((invite) => (
								<li
									key={invite._id}
									className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm"
								>
									<span className="truncate">{invite.email}</span>
									<span className="text-muted-foreground">{invite.status}</span>
								</li>
							))}
						</ul>
					) : null}
				</section>
			) : null}
		</div>
	);
}
