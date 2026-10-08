import { Bell, ChevronsUpDown, Filter, Plus, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "~/components/shared/PageHeader";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
	SAMPLE_CONTEXT,
	SAMPLE_TASKS,
	STATUS_LABEL,
	STATUS_TONE,
} from "~/features/design/sample";
import { initials } from "~/lib/initials";
import { ShortcutHint } from "~/shell/shortcuts/ShortcutHint";
import { ContextTabs } from "~/shell/topbar/ContextTabs";
import { EnginLogo } from "~/shell/topbar/EnginLogo";

/** A Startup's Cycles screen in miniature: chrome, header, rows, a form card. */
export function SamplePage() {
	const [open, setOpen] = useState(false);

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-background">
			<ChromePreview />
			<PageHeader
				title="Cycles"
				meta="3 active · 12 tasks in review"
				actions={
					<>
						<Button variant="outline" size="sm">
							<Filter />
							Filter
						</Button>
						<Button size="sm" onClick={() => setOpen(true)}>
							<Plus />
							New Cycle
						</Button>
					</>
				}
			/>
			<div className="space-y-8 px-4 py-6 md:px-6">
				<TaskRows />
				<SettingsCard />
			</div>
			<NewCycleDialog open={open} onOpenChange={setOpen} />
		</div>
	);
}

/** Static copy of the top bar's two rows, so the sample shows Startup tabs. */
function ChromePreview() {
	return (
		<div aria-hidden className="pointer-events-none select-none">
			<div className="flex h-14 items-center gap-2 px-4 md:px-6">
				<EnginLogo tabIndex={-1} />
				<span className="text-lg text-input">/</span>
				<span className="flex h-8 items-center gap-2 rounded-md px-1.5 text-sm font-medium">
					<Avatar className="size-6">
						<AvatarFallback className="text-xs">AC</AvatarFallback>
					</Avatar>
					Acme
					<ChevronsUpDown className="size-3.5 text-subtle-foreground" />
				</span>
				<span className="text-lg text-input">/</span>
				<span className="text-sm font-medium">Sprint 4</span>
				<span className="flex-1" />
				<span className="hidden h-8 w-60 items-center gap-2 rounded-md border border-input px-2.5 text-sm text-subtle-foreground md:flex">
					<Search className="size-4 text-muted-foreground" />
					<span className="flex-1">Find…</span>
					<ShortcutHint id="palette.open" />
				</span>
				<span className="flex size-8 items-center justify-center text-muted-foreground">
					<Bell className="size-4" />
				</span>
				<Avatar className="size-8 rounded-full">
					<AvatarFallback className="rounded-full text-xs">RR</AvatarFallback>
				</Avatar>
			</div>
			<div className="flex h-12 items-stretch border-b border-border px-4 md:px-6">
				<ContextTabs context={SAMPLE_CONTEXT} />
			</div>
		</div>
	);
}

function TaskRows() {
	return (
		<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
			{SAMPLE_TASKS.map((task) => (
				<li
					key={task.number}
					className="flex items-center gap-3 bg-card px-4 py-3 text-sm transition-colors hover:bg-accent"
				>
					<span className="w-10 shrink-0 font-mono text-xs text-subtle-foreground">
						#{task.number}
					</span>
					<span className="min-w-0 flex-1 truncate font-medium">
						{task.title}
					</span>
					<Badge
						variant="status"
						tone={STATUS_TONE[task.status]}
						className="hidden sm:inline-flex"
					>
						{STATUS_LABEL[task.status]}
					</Badge>
					<span className="hidden w-14 shrink-0 text-right text-muted-foreground md:inline">
						{task.due}
					</span>
					<Avatar className="size-6 rounded-full">
						<AvatarFallback className="rounded-full text-[10px]">
							{initials(task.assignee, null)}
						</AvatarFallback>
					</Avatar>
				</li>
			))}
		</ul>
	);
}

function SettingsCard() {
	return (
		<Card className="max-w-2xl">
			<CardHeader>
				<CardTitle>Startup name</CardTitle>
				<CardDescription>
					Shown on your public page, Roles and every hackathon.
				</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<div className="grid gap-2">
					<Label htmlFor="sample-name">Name</Label>
					<Input id="sample-name" defaultValue="Acme" />
				</div>
				<div className="grid gap-2">
					<Label htmlFor="sample-slug">URL</Label>
					<Input id="sample-slug" defaultValue="acme" />
				</div>
			</CardContent>
			<CardFooter className="justify-between">
				<p className="text-sm text-muted-foreground">
					Use 48 characters at most.
				</p>
				<Button size="sm">Save</Button>
			</CardFooter>
		</Card>
	);
}

function NewCycleDialog({
	open,
	onOpenChange,
}: {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New Cycle</DialogTitle>
					<DialogDescription>
						A Cycle is a stretch of work with a start and an end.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="cycle-title">Title</Label>
						<Input id="cycle-title" placeholder="Sprint 5" />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="cycle-goal">Goal</Label>
						<Textarea
							id="cycle-goal"
							placeholder="What should be true at the end?"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={() => onOpenChange(false)}>Create Cycle</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
