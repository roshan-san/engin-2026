import { useConvexAuth } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { MailQuestion } from "lucide-react";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { PageHeader } from "~/components/shared/PageHeader";
import { Button } from "~/components/ui/button";
import { useAcceptInvite } from "~/features/teams/team/hooks/useAcceptInvite";

type InviteAcceptPageProps = {
	readonly token: string;
};

export function InviteAcceptPage({ token }: InviteAcceptPageProps) {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const { invite, isPending, accept } = useAcceptInvite(token);

	if (isLoading || invite === undefined) {
		return (
			<div className="mx-auto w-full max-w-3xl py-6">
				<PageLoading rows={3} />
			</div>
		);
	}

	if (!invite) {
		return (
			<div className="mx-auto w-full max-w-3xl py-6">
				<EmptyState
					icon={MailQuestion}
					title="Invite not found"
					body="The link may be mistyped or the invite was revoked."
					action={
						<Button asChild>
							<Link to="/">Go home</Link>
						</Button>
					}
				/>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6 py-6">
			<PageHeader
				title={`Join ${invite.startupName}`}
				meta={`You were invited to join as ${invite.role}.`}
			/>

			{invite.isExpired || invite.status !== "pending" ? (
				<p className="text-sm text-muted-foreground">
					This invite is no longer valid.
				</p>
			) : isAuthenticated ? (
				<Button onClick={accept} disabled={isPending}>
					{isPending ? "Joining..." : "Accept invite"}
				</Button>
			) : (
				<div className="space-y-3">
					<p className="text-sm text-muted-foreground">
						Sign in with Google to accept this invite.
					</p>
					<Button asChild>
						<Link to="/">Sign in</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
