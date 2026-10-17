import type { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";

/** Copies the public Hackathon page's link, to share with Applicants. Shows the link itself if the clipboard is blocked. */
export function copyHackathonLink(hackathonId: Id<"hackathons">) {
	const url = `${window.location.origin}/hackathons/${hackathonId}`;
	navigator.clipboard
		.writeText(url)
		.then(() => toast("Link copied"))
		.catch(() => toast(url));
}
