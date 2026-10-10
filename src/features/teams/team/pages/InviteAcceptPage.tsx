import { Page } from "~/components/shared/Page";
import { useConvexAuth } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { MailQuestion } from "lucide-react";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { PageHeader } from "~/components/shared/PageHeader";
import { Button } from "~/components/ui/button";
import { GoogleButton } from "~/features/people/auth/components/GoogleButton";
import { useAcceptInvite } from "~/features/teams/team/hooks/useAcceptInvite";

type InviteAcceptPageProps = {
	readonly token: string;
};

export function InviteAcceptPage({ token }: InviteAcceptPageProps) {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const { invite, isPending, accept } = useAcceptInvite(token);

	if (isLoading || invite === undefined) {
		return (
			<>
				<Page width="narrow">
					<PageLoading rows={3} />
				</Page>
			</>
		);
	}

	if (!invite) {
		return (
			<>
				<Page width="narrow">
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
				</Page>
			</>
		);
	}

	return (
		<>
			<PageHeader
				width="narrow"
				title={`Join ${invite.startupName}`}
				meta={`You were invited to join as ${invite.role}.`}
			/>
			<Page width="narrow" className="space-y-6">
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
						<GoogleButton
							label="Sign in"
							variant="default"
							returnTo={`/invite/${token}`}
						/>
					</div>
				)}
			</Page>
		</>
	);
}
