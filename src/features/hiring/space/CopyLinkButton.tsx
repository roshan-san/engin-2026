import type { Id } from "@convex/_generated/dataModel";
import { LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";

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
			onClick={() => {
				const url = `${window.location.origin}/hackathons/${hackathonId}`;
				navigator.clipboard
					.writeText(url)
					.then(() => toast("Link copied"))
					.catch(() => toast(url));
			}}
		>
			<LinkIcon />
			Copy link
		</Button>
	);
}
