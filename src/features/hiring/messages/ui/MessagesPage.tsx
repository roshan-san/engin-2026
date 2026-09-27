import { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";

export function MessagesPage() {
	const rooms = useQuery(api.hiring.trialMessages.listRooms);

	return (
		<div className="mx-auto w-full max-w-2xl space-y-6 py-8">
			<div>
				<h1 className="text-2xl font-bold">Messages</h1>
				<p className="mt-1 text-muted-foreground">
					Trial Cycle rooms you can talk in.
				</p>
			</div>
			{rooms === undefined ? (
				<PageLoading />
			) : rooms.length === 0 ? (
				<EmptyState
					title="No rooms yet"
					description="Join a Trial Cycle or open one from your startup to start a conversation."
				/>
			) : (
				<ul className="space-y-2">
					{rooms.map((room) => (
						<li key={room.trialCycleId}>
							<Link
								to="/app/trials/$trialCycleId"
								params={{ trialCycleId: room.trialCycleId }}
								className="block rounded-lg border p-4 hover:bg-muted/30"
							>
								<p className="font-medium">{room.title}</p>
								<p className="text-sm text-muted-foreground">Trial Cycle</p>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
