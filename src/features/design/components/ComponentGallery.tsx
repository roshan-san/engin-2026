import { ArrowRight, MoreHorizontal, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";

const VARIANTS = [
	"default",
	"secondary",
	"outline",
	"ghost",
	"destructive",
	"link",
] as const;
const SIZES = ["sm", "default", "lg"] as const;
const TONES = ["neutral", "success", "warning", "link", "destructive"] as const;

function Group({
	title,
	children,
}: {
	readonly title: string;
	readonly children: ReactNode;
}) {
	return (
		<section className="space-y-4">
			<SectionLabel as="h3">{title}</SectionLabel>
			{children}
		</section>
	);
}

/** Every shared component in every variant and state, on the current system. */
export function ComponentGallery() {
	return (
		<div className="space-y-10">
			<Group title="Type">
				<div className="space-y-2">
					<p className="text-2xl font-semibold tracking-tight">
						Page title, 24px semibold
					</p>
					<p className="text-base font-semibold">Section heading</p>
					<p className="text-sm">
						Body text: the quick brown fox ships the proof link.
					</p>
					<p className="text-sm text-muted-foreground">
						Muted: secondary details and meta lines.
					</p>
					<p className="font-mono text-sm text-muted-foreground">
						Mono: #128 · 4,820 Score · ⌘K
					</p>
					<a href="#type" className="text-sm text-link hover:underline">
						A link in body text
					</a>
				</div>
			</Group>

			<Group title="Buttons">
				<div className="space-y-3">
					{SIZES.map((size) => (
						<div key={size} className="flex flex-wrap items-center gap-2">
							{VARIANTS.map((variant) => (
								<Button key={variant} variant={variant} size={size}>
									{variant}
								</Button>
							))}
						</div>
					))}
					<div className="flex flex-wrap items-center gap-2">
						<Button>
							<Plus />
							With icon
						</Button>
						<Button variant="outline">
							Continue
							<ArrowRight />
						</Button>
						<Button disabled>Disabled</Button>
						<Button variant="outline" disabled>
							Disabled
						</Button>
						<Button variant="outline" size="icon" aria-label="More">
							<MoreHorizontal />
						</Button>
					</div>
				</div>
			</Group>

			<Group title="Inputs">
				<div className="grid max-w-3xl gap-4 sm:grid-cols-2">
					<div className="grid gap-2">
						<Label htmlFor="g-default">Default</Label>
						<Input id="g-default" placeholder="Startup name" />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="g-filled">Filled</Label>
						<Input id="g-filled" defaultValue="Acme Robotics" />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="g-disabled">Disabled</Label>
						<Input id="g-disabled" disabled defaultValue="acme" />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="g-error">Error</Label>
						<Input id="g-error" aria-invalid defaultValue="not a url" />
						<p className="text-xs text-destructive">
							Enter a link starting with https://
						</p>
					</div>
					<div className="grid gap-2">
						<Label>Select</Label>
						<Select defaultValue="growth">
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="growth">Growth</SelectItem>
								<SelectItem value="payments">Payments</SelectItem>
								<SelectItem value="platform">Platform</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-2 self-end pb-2">
						<Checkbox id="g-check" defaultChecked />
						<Label htmlFor="g-check">Notify every co-founder</Label>
					</div>
					<div className="grid gap-2 sm:col-span-2">
						<Label htmlFor="g-text">Textarea</Label>
						<Textarea
							id="g-text"
							placeholder="What should be true at the end of this Cycle?"
						/>
					</div>
				</div>
			</Group>

			<Group title="Badges">
				<div className="flex flex-wrap items-center gap-2">
					<Badge>Default</Badge>
					<Badge variant="secondary">Secondary</Badge>
					<Badge variant="outline">Outline</Badge>
					<Badge variant="destructive">Destructive</Badge>
					{TONES.map((tone) => (
						<Badge key={tone} variant="status" tone={tone}>
							{tone}
						</Badge>
					))}
				</div>
			</Group>

			<Group title="Tabs, menu, tooltip">
				<div className="flex flex-wrap items-start gap-8">
					<Tabs defaultValue="open" className="min-w-72">
						<TabsList>
							<TabsTrigger value="open">Open</TabsTrigger>
							<TabsTrigger value="drafts">Drafts</TabsTrigger>
							<TabsTrigger value="closed">Closed</TabsTrigger>
						</TabsList>
						<TabsContent
							value="open"
							className="pt-2 text-sm text-muted-foreground"
						>
							3 open hackathons
						</TabsContent>
						<TabsContent
							value="drafts"
							className="pt-2 text-sm text-muted-foreground"
						>
							1 draft
						</TabsContent>
						<TabsContent
							value="closed"
							className="pt-2 text-sm text-muted-foreground"
						>
							Nothing closed yet
						</TabsContent>
					</Tabs>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">Open menu</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-52">
							<DropdownMenuItem>
								Edit
								<DropdownMenuShortcut>E</DropdownMenuShortcut>
							</DropdownMenuItem>
							<DropdownMenuItem>Duplicate</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost">Hover me</Button>
							</TooltipTrigger>
							<TooltipContent>Only founders can verify</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</Group>

			<Group title="Loading">
				<div className="max-w-md space-y-3">
					<Skeleton className="h-5 w-1/3" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-4/5" />
				</div>
			</Group>
		</div>
	);
}
