import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { useCurrentUser } from "~/features/app/hooks/useCurrentUser";
import { AppNav } from "~/features/app/layout/AppNav";
import { NotificationBell } from "~/features/app/ui/NotificationBell";
import { ScoreChip } from "~/features/app/ui/ScoreChip";
import { StartupSwitcher } from "~/features/app/ui/StartupSwitcher";
import { UserMenu } from "~/features/app/ui/UserMenu";
import { PendingOffers } from "~/features/offers/components/PendingOffers";

export function AppShell({ children }: { readonly children: React.ReactNode }) {
	const { user: me } = useCurrentUser();
	const isPro = me?.planTier === "pro";

	return (
		<div className="flex min-h-dvh flex-col bg-background text-foreground">
			<header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
				<div className="relative flex h-16 items-center justify-between gap-3 px-4 md:px-6">
					<div className="relative z-10 flex min-w-0 items-center gap-2">
						<Link
							to="/app"
							className="shrink-0 text-xl font-semibold tracking-tight"
						>
							Engin
						</Link>
						<span aria-hidden className="hidden h-4 w-px bg-border sm:block" />
						<StartupSwitcher />
					</div>

					<div className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
						<div className="pointer-events-auto">
							<AppNav placement="header" />
						</div>
					</div>

					<div className="relative z-10 flex shrink-0 items-center gap-2">
						{me ? (
							<>
								<NotificationBell />
								<ScoreChip score={me.score} isPro={isPro} />
								{!isPro ? (
									<Button
										asChild
										size="sm"
										className="hidden h-8 px-3 lg:inline-flex"
									>
										<Link to="/app/upgrade">Upgrade</Link>
									</Button>
								) : null}
								{me.name || me.email ? (
									<UserMenu
										name={me.name ?? me.email ?? "You"}
										email={me.email}
										image={me.image}
										username={me.username}
									/>
								) : null}
							</>
						) : null}
					</div>
				</div>
			</header>

			<main className="w-full flex-1 px-4 pb-24 sm:px-6 md:pb-8 lg:px-8">
				<PendingOffers />
				{children}
			</main>

			<AppNav placement="dock" />
		</div>
	);
}
