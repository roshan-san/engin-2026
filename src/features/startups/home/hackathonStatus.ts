type Status = { label: string; to: "/hackathons/$id" | "/h/$id" };

/** Where one of your applications stands, and where it opens. */
export function myHackathonStatus(application: {
	status: "applied" | "declined" | "building" | "left";
	decision: "hired" | "not_this_time" | null;
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
			return application.decision
				? { label: "Decided", to: "/h/$id" }
				: { label: "Building", to: "/h/$id" };
	}
}
