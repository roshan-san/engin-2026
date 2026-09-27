import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageLoading } from "~/components/globals/PageLoading";
import { PublicHeader } from "~/components/shared/PublicHeader";
import { Input } from "~/components/ui/input";
import { useExplore } from "~/features/marketing/explore/hooks/useExplore";

type ExplorePageProps = {
	readonly inApp?: boolean;
};

export function ExplorePage({ inApp = false }: ExplorePageProps) {
	const { term, setTerm, results } = useExplore();

	const content = (
		<div className="mx-auto w-full max-w-6xl space-y-8 py-8">
			<div className="space-y-3">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Explore
				</h1>
				<p className="max-w-xl text-muted-foreground">
					Startups currently building on Engin.
				</p>
			</div>

			<div className="relative max-w-xl">
				<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={term}
					onChange={(event) => setTerm(event.target.value)}
					placeholder="Search startups"
					className="h-12 rounded-full pl-10"
				/>
			</div>

			{results === undefined ? (
				<PageLoading rows={4} />
			) : results.startups.length === 0 ? (
				<p className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
					{term ? "No startups match that search." : "No public startups yet."}
				</p>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{results.startups.map((startup) => (
						<Link
							key={startup._id}
							to="/startup/$slug"
							params={{ slug: startup.slug }}
							className="group flex flex-col rounded-xl border border-border p-6 hover:bg-muted/20"
						>
							<h2 className="text-lg font-semibold tracking-tight group-hover:text-primary">
								{startup.name}
							</h2>
							{startup.tagline ? (
								<p className="mt-2 line-clamp-2 flex-1 text-muted-foreground">
									{startup.tagline}
								</p>
							) : (
								<span className="mt-2 flex-1" />
							)}
							<p className="mt-6 text-sm text-muted-foreground">
								{startup.followerCount === 0
									? "New on Engin"
									: `${startup.followerCount} followers`}
							</p>
						</Link>
					))}
				</div>
			)}
		</div>
	);

	if (inApp) {
		return content;
	}

	return (
		<div className="min-h-dvh bg-background">
			<PublicHeader />
			<div className="px-4 sm:px-6 lg:px-8">{content}</div>
		</div>
	);
}
