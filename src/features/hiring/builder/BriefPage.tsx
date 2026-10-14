import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";
import { AppPage } from "~/components/AppPage";
import { Button } from "~/components/ui/button";
import { roleLabel } from "../jobChips";
import { BuilderBrief } from "./BuilderBrief";
import { useBuilder } from "./BuilderGate";

/** The Builder's Brief tab: the problem and how it ends, full width. */
export function BriefPage() {
	const { page } = useBuilder();

	return (
		<AppPage
			bar={{
				title: (
					<h1 className="truncate text-sm">
						<span className="font-medium">{roleLabel(page.job.role)}</span>
						<span className="text-muted-foreground">
							{" "}
							· {page.startup.name}
						</span>
					</h1>
				),
				actions: (
					<Button asChild variant="ghost" size="sm">
						<Link
							to="/hackathons/$id"
							params={{ id: page._id }}
							aria-label="Public post"
						>
							<span className="hidden sm:inline">Public post</span>
							<ArrowUpRightIcon />
						</Link>
					</Button>
				),
			}}
		>
			<BuilderBrief hackathon={page} />
		</AppPage>
	);
}
