import type { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { applicationStatusLabel } from "~/features/hiring/myHackathons/constants";
import { useLeaveHackathon } from "~/features/hiring/myHackathons/hooks/useLeaveHackathon";
import { verdictLabel } from "~/features/hiring/hackathons/constants";
import { formatDateRange } from "~/lib/dates";

export type Entry = FunctionReturnType<
	typeof api.hiring.applications.listMine
>[number];

export function MyHackathonRow({ entry }: { readonly entry: Entry }) {
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const { leave, isPending } = useLeaveHackathon();
	const title = entry.hackathonTitle ?? "Hackathon";
	const canWithdraw = entry.isLive && entry.hackathonStatus === "open";

	return (
		<li className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0 space-y-1">
				<Link
					to="/hackathons/$hackathonId"
					params={{ hackathonId: entry.hackathonId }}
					className="font-medium break-words hover:underline"
				>
					{title}
				</Link>
				<p className="text-sm text-muted-foreground break-words">
					{entry.startupName}
					{entry.roleTitle ? ` · ${entry.roleTitle}` : null}
					{entry.startsAt !== null && entry.endsAt !== null
						? ` · ${formatDateRange(entry.startsAt, entry.endsAt)}`
						: null}
				</p>
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant={entry.isLive ? "default" : "secondary"}>
						{entry.verdict
							? verdictLabel(entry.verdict)
							: applicationStatusLabel(entry.status, entry.hackathonStatus)}
					</Badge>
					{entry.verdict ? (
						<Link
							to="/s/$slug/hackathons/$hackathonId"
							params={{
								slug: entry.startupSlug,
								hackathonId: entry.hackathonId,
							}}
							className="text-sm hover:underline"
						>
							See verdict
						</Link>
					) : null}
				</div>
			</div>

			{canWithdraw ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="self-start sm:self-center"
					disabled={isPending}
					onClick={() => setIsConfirmOpen(true)}
				>
					Withdraw
				</Button>
			) : null}

			<AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Withdraw from “{title}”?</AlertDialogTitle>
						<AlertDialogDescription>
							You can't apply to this Hackathon again. Withdrawing frees one of
							your live entries.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Stay in</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={isPending}
							onClick={async (event) => {
								event.preventDefault();
								if (await leave(entry.hackathonId)) {
									setIsConfirmOpen(false);
								}
							}}
						>
							{isPending ? <Spinner /> : null}
							Withdraw
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</li>
	);
}
