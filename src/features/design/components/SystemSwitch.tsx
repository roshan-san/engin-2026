import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";
import { DESIGN_SYSTEMS, type DesignSystem } from "~/features/design/systems";

/** Segmented control: one link per system, so the URL keeps the choice. */
export function SystemSwitch({ current }: { readonly current: DesignSystem }) {
	const blurb = DESIGN_SYSTEMS.find((system) => system.id === current)?.blurb;

	return (
		<div className="flex flex-col items-end gap-2">
			<nav
				aria-label="Design system"
				className="inline-flex rounded-lg border border-input bg-background p-0.5"
			>
				{DESIGN_SYSTEMS.map((system) => (
					<Link
						key={system.id}
						to="/design"
						search={{ system: system.id }}
						aria-current={system.id === current ? "page" : undefined}
						className={cn(
							"rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
							system.id === current
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{system.label}
					</Link>
				))}
			</nav>
			<p className="text-xs text-muted-foreground">{blurb}</p>
		</div>
	);
}
