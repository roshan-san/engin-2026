import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { initials } from "~/lib/initials";
import { cn } from "~/lib/utils";
import type { EntryView } from "./record";

/** A person's small face in the feed. */
export function ActorAvatar({
	person,
	className,
}: {
	readonly person: EntryView["actor"];
	readonly className?: string;
}) {
	return (
		<Avatar className={cn("size-6", className)}>
			{person?.image ? <AvatarImage src={person.image} alt="" /> : null}
			<AvatarFallback className="text-[10px]">
				{initials(person?.name ?? null, person?.username ?? null)}
			</AvatarFallback>
		</Avatar>
	);
}
