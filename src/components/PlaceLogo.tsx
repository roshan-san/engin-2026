import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { initials } from "~/lib/initials";
import { cn } from "~/lib/utils";

const SIZE = {
	sm: "size-5 rounded text-[10px]",
	md: "size-8 rounded-md text-xs",
	lg: "size-10 rounded-lg text-sm",
	xl: "size-16 rounded-xl text-lg",
};

/** A Startup's logo, or its initials when it has none. */
export function PlaceLogo({
	name,
	url,
	size = "md",
}: {
	readonly name: string;
	readonly url: string | null;
	readonly size?: keyof typeof SIZE;
}) {
	return (
		<Avatar className={cn("shrink-0", SIZE[size])}>
			{url ? <AvatarImage src={url} alt="" /> : null}
			<AvatarFallback className={cn(SIZE[size])}>
				{initials(name, null)}
			</AvatarFallback>
		</Avatar>
	);
}
