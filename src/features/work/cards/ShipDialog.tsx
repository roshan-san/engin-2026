import {
	MAX_SHIPPED_IMAGES,
	MAX_SHIPPED_LINKS,
	TEXT,
} from "@convex/shared/limits";
import { XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { type CardView, landsIn, useBoardScope } from "~/entities/card";
import { isSendKey } from "~/shared/lib/keys";
import { usePictures } from "~/shared/lib/usePictures";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/shared/ui/dialog";
import { Input } from "~/shared/ui/input";
import { MentorNote } from "~/shared/ui/MentorNote";
import { Spinner } from "~/shared/ui/spinner";
import { parseLink, shipMissing } from "./shipReady";
import { useSubmit } from "./useSubmit";

/** What shipped: a line plus proof. The Card moves only once this is submitted. */
export function ShipDialog({
	card,
	onClose,
}: {
	readonly card: CardView;
	readonly onClose: () => void;
}) {
	const scope = useBoardScope();
	const { submit } = useSubmit();
	const [line, setLine] = useState("");
	const [links, setLinks] = useState<string[]>([]);
	const [linkText, setLinkText] = useState("");
	const { pictures, isUploading, addImages, removePicture } = usePictures({
		max: MAX_SHIPPED_IMAGES,
		skippedMessage: `Some files were skipped. Add up to ${MAX_SHIPPED_IMAGES} images.`,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const marksDone = landsIn(card, scope) === "done";
	// Closing mid-send or mid-upload would lose the proof and orphan its files.
	const isBusy = isUploading || isSubmitting;
	const missing = shipMissing({
		line,
		links,
		images: pictures.length,
		linkText,
	});
	const canSubmit = missing === null && !isUploading && !isSubmitting;

	function addLink(text: string) {
		const link = parseLink(text);
		if (!link) {
			toast("Links must start with http:// or https://");
			return;
		}
		if (!links.includes(link)) setLinks([...links, link]);
		setLinkText("");
	}

	async function handleSubmit() {
		if (!canSubmit) return;
		setIsSubmitting(true);
		const images = pictures.flatMap((p) => (p.storageId ? [p.storageId] : []));
		// A link typed but never added still ships.
		const typed = parseLink(linkText);
		const isSubmitted = await submit(card._id, {
			line: line.trim(),
			links: typed && !links.includes(typed) ? [...links, typed] : links,
			images,
		});
		if (isSubmitted) {
			onClose();
		} else {
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog open onOpenChange={(isOpen) => !isOpen && !isBusy && onClose()}>
			<DialogContent
				showCloseButton={!isBusy}
				className={isDragOver ? "ring-2 ring-ring" : undefined}
				onKeyDown={(e) => {
					if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
						e.preventDefault();
						void handleSubmit();
					}
				}}
				onPaste={(e) => {
					const files = [...e.clipboardData.files];
					if (files.length === 0) return;
					e.preventDefault();
					addImages(files);
				}}
				onDragOver={(e) => {
					if (!e.dataTransfer.types.includes("Files")) return;
					e.preventDefault();
					setIsDragOver(true);
				}}
				onDragLeave={() => setIsDragOver(false)}
				onDrop={(e) => {
					if (e.dataTransfer.files.length === 0) return;
					e.preventDefault();
					setIsDragOver(false);
					addImages([...e.dataTransfer.files]);
				}}
			>
				<DialogHeader>
					<DialogTitle>What shipped?</DialogTitle>
					<DialogDescription className="truncate">
						{card.title}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-1.5">
					<Input
						aria-label="What shipped"
						value={line}
						maxLength={TEXT.shippedLine}
						autoFocus
						onChange={(e) => setLine(e.target.value)}
					/>
					<MentorNote>What changed, in one line.</MentorNote>
				</div>

				<div className="flex flex-col gap-2">
					{links.length > 0 ? (
						<div className="flex flex-wrap gap-1.5">
							{links.map((link) => (
								<Badge
									key={link}
									variant="outline"
									className="max-w-full gap-1 py-0 pr-0"
								>
									<span className="truncate">{link}</span>
									<button
										type="button"
										aria-label={`Remove ${link}`}
										className="flex size-8 shrink-0 items-center justify-center rounded-full hover:text-foreground focus-ring"
										onClick={() => setLinks(links.filter((l) => l !== link))}
									>
										<XIcon />
									</button>
								</Badge>
							))}
						</div>
					) : null}
					{links.length < MAX_SHIPPED_LINKS ? (
						<Input
							aria-label="Link"
							placeholder="Paste a link"
							value={linkText}
							onChange={(e) => setLinkText(e.target.value)}
							onKeyDown={(e) => {
								if (e.metaKey || e.ctrlKey) return;
								if (isSendKey(e.nativeEvent) && linkText.trim()) {
									e.preventDefault();
									addLink(linkText);
								}
							}}
							onPaste={(e) => {
								const text = e.clipboardData.getData("text");
								if (e.clipboardData.files.length > 0 || !parseLink(text)) {
									return;
								}
								e.preventDefault();
								addLink(text);
							}}
						/>
					) : null}
				</div>

				<div className="flex flex-col gap-2">
					{pictures.length > 0 ? (
						<ul className="flex flex-wrap gap-2">
							{pictures.map((picture) => (
								<li
									key={picture.key}
									className="relative size-16 overflow-hidden rounded-md border border-border"
								>
									<img
										src={picture.previewUrl}
										alt=""
										className="size-full object-cover"
									/>
									{picture.storageId === null ? (
										<div className="absolute inset-0 flex items-center justify-center bg-background/60">
											<Spinner />
										</div>
									) : null}
									<button
										type="button"
										aria-label="Remove image"
										className="absolute top-0 right-0 flex size-8 items-center justify-center rounded-full focus-ring"
										onClick={() => removePicture(picture)}
									>
										<span className="rounded-full bg-background/80 p-0.5">
											<XIcon className="size-3" />
										</span>
									</button>
								</li>
							))}
						</ul>
					) : null}
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={pictures.length >= MAX_SHIPPED_IMAGES}
							onClick={() => fileInputRef.current?.click()}
						>
							Add image
						</Button>
						<MentorNote>Paste or drop images.</MentorNote>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							multiple
							hidden
							onChange={(e) => {
								addImages([...(e.target.files ?? [])]);
								e.target.value = "";
							}}
						/>
					</div>
				</div>

				<DialogFooter className="sm:items-center">
					{missing ? (
						<MentorNote>
							{missing === "line"
								? "Add what shipped"
								: missing === "invalidLink"
									? "Links start with https://"
									: "Add a link or an image"}
						</MentorNote>
					) : null}
					<Button disabled={!canSubmit} onClick={() => void handleSubmit()}>
						{isBusy ? <Spinner /> : null}
						{marksDone ? "Mark done" : "Submit"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
