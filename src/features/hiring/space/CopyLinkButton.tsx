import type { Id } from "@convex/_generated/dataModel";
import { LinkIcon } from "lucide-react";
import { Button } from "~/shared/ui/button";
import { copyHackathonLink } from "./copyHackathonLink";

/** Copies the public Hackathon page's link, to share with Applicants. */
export function CopyLinkButton({
	hackathonId,
	variant = "outline",
}: {
	readonly hackathonId: Id<"hackathons">;
	readonly variant?: "outline" | "ghost";
}) {
	return (
		<Button
			variant={variant}
			size={variant === "ghost" ? "sm" : "default"}
			aria-label="Copy link"
			onClick={() => copyHackathonLink(hackathonId)}
		>
			<LinkIcon />
			{/* The bar is tight on a phone, so the ghost button there is just the icon. */}
			<span className={variant === "ghost" ? "hidden sm:inline" : undefined}>
				Copy link
			</span>
		</Button>
	);
}
