import { Link } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Skeleton } from "~/components/ui/skeleton";
import { useIsMobile } from "~/hooks/use-mobile";
import { cn } from "~/lib/utils";
import type { ShellContext, Tab } from "~/shell/context";

const TAB_CLASS =
	"relative flex h-full shrink-0 items-center whitespace-nowrap px-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground";
const ACTIVE_CLASS =
	"text-foreground after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary";

/**
 * The current context's sections. Desktop shows overflow tabs (Settings)
 * behind `···`; on phone every tab sits in one scrolling strip and the
 * active one scrolls into view.
 */
export function ContextTabs({
	context,
	className,
}: {
	readonly context: ShellContext;
	readonly className?: string;
}) {
	const isMobile = useIsMobile();
	const activeRef = useRef<HTMLAnchorElement | null>(null);
	const activeHref =
		"activeTab" in context ? context.activeTab?.href : undefined;

	useEffect(() => {
		if (!isMobile || !activeHref) return;
		activeRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
	}, [isMobile, activeHref]);

	if (context.kind === "neutral") return null;

	if (context.kind === "loading") {
		return (
			<div
				className={cn("flex h-11 items-center gap-3 md:h-14", className)}
				aria-hidden
			>
				<Skeleton className="h-4 w-14 rounded-md" />
				<Skeleton className="h-4 w-14 rounded-md" />
				<Skeleton className="h-4 w-14 rounded-md" />
			</div>
		);
	}

	const overflow = context.tabs.filter((tab) => tab.overflow);
	const overflowActive = overflow.some((tab) => tab.href === activeHref);

	function tabLink(tab: Tab, extraClass?: string) {
		const active = tab.href === activeHref;
		return (
			<Link
				key={tab.href}
				to={tab.href}
				ref={active ? activeRef : undefined}
				activeOptions={{ exact: true }}
				aria-current={active ? "page" : undefined}
				className={cn(TAB_CLASS, active && ACTIVE_CLASS, extraClass)}
			>
				{tab.label}
			</Link>
		);
	}

	return (
		<nav
			aria-label="Sections"
			className={cn(
				"flex h-11 min-w-0 items-stretch overflow-x-auto [scrollbar-width:none] md:h-14 [&::-webkit-scrollbar]:hidden",
				className,
			)}
		>
			{context.tabs.map((tab) =>
				tab.overflow ? tabLink(tab, "md:hidden") : tabLink(tab),
			)}
			{overflow.length > 0 ? (
				<DropdownMenu>
					<DropdownMenuTrigger
						aria-label="More sections"
						className={cn(
							TAB_CLASS,
							"hidden outline-none md:flex",
							overflowActive && ACTIVE_CLASS,
						)}
					>
						<MoreHorizontal className="size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-44">
						{overflow.map((tab) => (
							<DropdownMenuItem key={tab.href} asChild>
								<Link
									to={tab.href}
									activeOptions={{ exact: true }}
									aria-current={tab.href === activeHref ? "page" : undefined}
								>
									{tab.label}
								</Link>
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			) : null}
		</nav>
	);
}
