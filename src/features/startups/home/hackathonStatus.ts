type Status = { label: string; to: "/hackathons/$id" | "/h/$id" };

/** A Builder still waiting for a decision, by where the Hackathon is. */
const BUILDER_LABEL = {
	draft: "Accepted",
	open: "Accepted",
	building: "Building",
	deciding: "Waiting",
	done: "No decision",
} as const;

/** Where one of your applications stands, and where it opens. */
export function myHackathonStatus(application: {
	status: "applied" | "declined" | "building" | "left";
	decision: "hired" | "not_this_time" | null;
	hackathonStatus: "draft" | "open" | "building" | "deciding" | "done";
}): Status {
	switch (application.status) {
		case "applied":
			return { label: "Applied", to: "/hackathons/$id" };
		case "declined":
		case "left":
			return { label: "Not this time", to: "/hackathons/$id" };
		case "building":
			if (application.decision === "hired") {
				return { label: "Hired", to: "/h/$id" };
			}
			if (application.decision) {
				return { label: "Decided", to: "/h/$id" };
			}
			return {
				label: BUILDER_LABEL[application.hackathonStatus],
				to: "/h/$id",
			};
	}
}
