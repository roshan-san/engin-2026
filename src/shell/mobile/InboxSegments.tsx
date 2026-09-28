import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

/**
 * Mobile-only Notifications | Threads toggle on Inbox (D-16): Threads live
 * inside Inbox on mobile, while desktop keeps Threads as its own sidebar
 * item — this component never shows at `md` and up.
 */
export function InboxSegments() {
	const navigate = useNavigate();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const value = pathname.startsWith("/threads") ? "threads" : "inbox";

	return (
		<div className="md:hidden">
			<Tabs
				value={value}
				onValueChange={(next) => {
					void navigate({ to: next === "threads" ? "/threads" : "/inbox" });
				}}
			>
				<TabsList className="w-full">
					<TabsTrigger value="inbox" className="flex-1">
						Notifications
					</TabsTrigger>
					<TabsTrigger value="threads" className="flex-1">
						Threads
					</TabsTrigger>
				</TabsList>
			</Tabs>
		</div>
	);
}
