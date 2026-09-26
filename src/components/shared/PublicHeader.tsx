import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

export function PublicHeader() {
	return (
		<header className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
			<Link to="/" className="text-xl font-semibold">
				Engin
			</Link>
			<Button asChild size="sm">
				<Link to="/">Join Engin</Link>
			</Button>
		</header>
	);
}
