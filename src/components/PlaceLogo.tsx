import { AVATAR_SIZE, type AvatarSize } from "~/components/avatarSize";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { initials } from "~/lib/initials";
import { cn } from "~/lib/utils";

const RADIUS: Record<AvatarSize, string> = {
	16: "rounded-sm",
	20: "rounded",
	24: "rounded",
	32: "rounded-md",
	40: "rounded-lg",
	64: "rounded-xl",
};

/** A Startup's logo, or its initials when it has none. Places are rounded squares; people are circles. */
export function PlaceLogo({
	name,
	url,
	size = 32,
}: {
	readonly name: string;
	readonly url: string | null;
	readonly size?: AvatarSize;
}) {
	return (
		<Avatar className={cn("shrink-0", AVATAR_SIZE[size], RADIUS[size])}>
			{url ? <AvatarImage src={url} alt="" /> : null}
			<AvatarFallback className={RADIUS[size]}>
				{initials(name, null)}
			</AvatarFallback>
		</Avatar>
	);
}
