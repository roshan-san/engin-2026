import {
	Link,
	type RegisteredRouter,
	type ValidateLinkOptions,
} from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PageBar } from "~/components/PageBar";

export type AppPageBar = {
	readonly back?: ReactNode;
	readonly title: ReactNode;
	readonly badge?: ReactNode;
	readonly actions?: ReactNode;
};

/**
 * Every app page: the 48px bar that never scrolls, one optional strip under it,
 * then the body (a centred column or edge to edge) beside the detail panel.
 */
export function AppPage({
	bar,
	notice,
	width = "column",
	panel,
	footer,
	children,
}: {
	readonly bar: AppPageBar;
	/** One strip under the bar: a Decision banner, Explore's filters. */
	readonly notice?: ReactNode;
	/** `column` centres about 768px and scrolls; `full` hands the space to the page, which scrolls itself. */
	readonly width?: "column" | "full";
	/** A `DetailPanel`. */
	readonly panel?: ReactNode;
	/** Scrolls with the page, after the content, and sits at the bottom when the content is short. Only for `column`; a `full` page places its own. */
	readonly footer?: ReactNode;
	readonly children: ReactNode;
}) {
	return (
		<div className="flex min-h-0 flex-1">
			<div className="flex min-h-0 min-w-0 flex-1 flex-col">
				<PageBar {...bar} />
				{notice ? <div className="shrink-0">{notice}</div> : null}
				{width === "full" ? (
					<div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
				) : (
					<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
						<div className="mx-auto w-full max-w-3xl shrink-0 px-4 py-6 md:px-6 md:py-8">
							{children}
						</div>
						{footer}
					</div>
				)}
			</div>
			{panel}
		</div>
	);
}

/** The bar's title. With a context line the page name is for screen readers only; the tab already says it. */
export function PageTitle({
	name,
	context,
}: {
	readonly name: string;
	readonly context?: ReactNode;
}) {
	if (!context) {
		return <h1 className="truncate text-sm font-medium">{name}</h1>;
	}
	return (
		<>
			<h1 className="sr-only">{name}</h1>
			<p className="truncate text-sm text-muted-foreground">{context}</p>
		</>
	);
}

type BackLinkProps<TOptions> = {
	readonly label: string;
	readonly link: ValidateLinkOptions<RegisteredRouter, TOptions>;
};

/** "← Hiring /" at the start of a nested page's bar. */
export function BackLink<TOptions>(props: BackLinkProps<TOptions>): ReactNode;
export function BackLink({ label, link }: BackLinkProps<unknown>) {
	return (
		<span className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
			<Link
				{...link}
				className="flex items-center gap-1 rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
			>
				<ArrowLeftIcon aria-hidden className="size-4" />
				{label}
			</Link>
			<span aria-hidden>/</span>
		</span>
	);
}
