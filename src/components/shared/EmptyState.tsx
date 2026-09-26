type EmptyStateProps = {
	readonly title: string;
	readonly description: string;
	readonly action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
	return (
		<div className="rounded-lg border border-dashed p-8 text-center">
			<p className="font-medium">{title}</p>
			<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			{action ? <div className="mt-4">{action}</div> : null}
		</div>
	);
}
