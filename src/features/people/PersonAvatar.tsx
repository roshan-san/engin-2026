import { AVATAR_SIZE, type AvatarSize } from "~/components/avatarSize";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { initials } from "~/lib/initials";
import { cn } from "~/lib/utils";

type Face = {
	readonly name: string | null;
	readonly username?: string | null;
	readonly image?: string | null;
};

/** A person's photo, or their initials. People are circles; places are rounded squares. */
export function PersonAvatar({
	person,
	size = 24,
	className,
}: {
	readonly person: Face | null | undefined;
	readonly size?: AvatarSize;
	readonly className?: string;
}) {
	return (
		<Avatar
			title={person?.name ?? person?.username ?? undefined}
			className={cn("shrink-0 rounded-full", AVATAR_SIZE[size], className)}
		>
			{person?.image ? <AvatarImage src={person.image} alt="" /> : null}
			<AvatarFallback className="rounded-full">
				{initials(person?.name ?? null, person?.username ?? null)}
			</AvatarFallback>
		</Avatar>
	);
}
