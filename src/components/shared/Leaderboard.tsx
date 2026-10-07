import type { LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";
import { Row, RowList } from "./RowList";

type LeaderboardEntry = {
	readonly key: string;
	readonly rank: number;
	readonly name: string;
	readonly avatar?: string | null;
	readonly value: ReactNode;
	readonly to?: string;
};

/** Ranked rows (`to` is a resolved path such as `/u/ada`) with the rank in tabular figures. Rank #1 is azure. */
export function Leaderboard({
	entries,
}: {
	readonly entries: readonly LeaderboardEntry[];
}) {
	return (
		<RowList>
			{entries.map((entry) => (
				<Row
					key={entry.key}
					to={entry.to as LinkProps["to"]}
					leading={
						<div className="flex items-center gap-3">
							<span
								className={cn(
									"w-6 text-right text-sm font-semibold tabular-nums",
									entry.rank === 1 ? "text-primary" : "text-muted-foreground",
								)}
							>
								{entry.rank}
							</span>
							<Avatar className="size-7">
								{entry.avatar ? (
									<AvatarImage src={entry.avatar} alt="" />
								) : null}
								<AvatarFallback>
									{entry.name.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
						</div>
					}
					title={entry.name}
					trailing={<span className="tabular-nums">{entry.value}</span>}
				/>
			))}
		</RowList>
	);
}
