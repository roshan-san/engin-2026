import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { initials } from "~/lib/initials";
import { cn } from "~/lib/utils";

type StartupAvatarProps = {
	readonly name: string;
	readonly className?: string;
};

/** Rounded-square Startup avatar (D-08) — initials-only, no image yet. */
export function StartupAvatar({ name, className }: StartupAvatarProps) {
	return (
		<Avatar className={cn("size-6", className)}>
			<AvatarFallback className="text-xs">
				{initials(name, null)}
			</AvatarFallback>
		</Avatar>
	);
}
