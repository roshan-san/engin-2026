import { Link } from "@tanstack/react-router";
import { EnginLogo } from "~/shell/EnginLogo";

/** The website pages' footer. */
export function SiteFooter() {
	return (
		<footer className="mt-auto border-t border-border">
			<div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted-foreground md:px-6">
				<EnginLogo tabIndex={-1} />
				<Link to="/explore" className="hover:text-foreground">
					Explore
				</Link>
				<Link to="/" hash="pricing" className="hover:text-foreground">
					Pricing
				</Link>
				<span className="ml-auto">© {new Date().getFullYear()} engin</span>
			</div>
		</footer>
	);
}
