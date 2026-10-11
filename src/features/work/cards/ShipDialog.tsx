import type { Id } from "@convex/_generated/dataModel";
import {
	MAX_SHIPPED_IMAGES,
	MAX_SHIPPED_LINKS,
	TEXT,
} from "@convex/lib/limits";
import { XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MentorNote } from "~/components/shared/MentorNote";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { errorMessage } from "~/lib/errors";
import { useUpload } from "../../shared/hooks/useUpload";
import { pickImages } from "../../shared/images";
import { useBoardScope } from "../board/BoardScope";
import { isSendKey } from "../board/keys";
import type { CardView } from "../board/types";
import { useSubmit } from "./hooks/useSubmit";

type Picture = {
	readonly key: string;
	readonly previewUrl: string;
	/** `null` while the file is still uploading. */
	readonly storageId: Id<"_storage"> | null;
};

/** The link in `text` when it's an http(s) URL, else `null`. */
function parseLink(text: string): string | null {
	const trimmed = text.trim();
	try {
		const url = new URL(trimmed);
		return url.protocol === "http:" || url.protocol === "https:"
			? trimmed
			: null;
	} catch {
		return null;
	}
}

/** What shipped: a line plus proof. The Card moves only once this is submitted. */
export function ShipDialog({
	card,
	onClose,
}: {
	readonly card: CardView;
	readonly onClose: () => void;
}) {
	const { userId, isFounder } = useBoardScope();
	const { submit } = useSubmit();
	const { upload } = useUpload();
	const [line, setLine] = useState("");
	const [links, setLinks] = useState<string[]>([]);
	const [linkText, setLinkText] = useState("");
	const [pictures, setPictures] = useState<Picture[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const picturesRef = useRef<Picture[]>([]);
	picturesRef.current = pictures;

	const marksDone = isFounder && card.owner?._id === userId;
	const isUploading = pictures.some((picture) => picture.storageId === null);
	const hasProof = links.length > 0 || pictures.length > 0;
	const canSubmit =
		line.trim().length > 0 && hasProof && !isUploading && !isSubmitting;

	// Thumbnails hold object URLs; free them when the dialog goes.
	useEffect(
		() => () => {
			for (const picture of picturesRef.current) {
				URL.revokeObjectURL(picture.previewUrl);
			}
		},
		[],
	);

	function addLink(text: string) {
		const link = parseLink(text);
		if (!link) {
			toast("Links start with http:// or https://");
			return;
		}
		if (!links.includes(link)) setLinks([...links, link]);
		setLinkText("");
	}

	function addImages(files: File[]) {
		const { accepted, skipped } = pickImages(
			files,
			MAX_SHIPPED_IMAGES - pictures.length,
		);
		if (skipped > 0) toast(`Images only, up to ${MAX_SHIPPED_IMAGES}.`);

		for (const file of accepted) {
			const picture: Picture = {
				key: crypto.randomUUID(),
				previewUrl: URL.createObjectURL(file),
				storageId: null,
			};
			setPictures((current) => [...current, picture]);
			upload(file).then(
				(storageId) =>
					setPictures((current) =>
						current.map((p) =>
							p.key === picture.key ? { ...p, storageId } : p,
						),
					),
				(error) => {
					toast.error(errorMessage(error));
					removePicture(picture);
				},
			);
		}
	}

	function removePicture(picture: Picture) {
		URL.revokeObjectURL(picture.previewUrl);
		setPictures((current) => current.filter((p) => p.key !== picture.key));
	}

	async function handleSubmit() {
		if (!canSubmit) return;
		setIsSubmitting(true);
		const images = pictures.flatMap((p) => (p.storageId ? [p.storageId] : []));
		const isSubmitted = await submit(card._id, {
			line: line.trim(),
			links,
			images,
		});
		if (isSubmitted) {
			onClose();
		} else {
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent
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
									className="max-w-full gap-1"
								>
									<span className="truncate">{link}</span>
									<button
										type="button"
										aria-label={`Remove ${link}`}
										className="rounded-full hover:text-foreground"
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
										className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5 hover:bg-background"
										onClick={() => removePicture(picture)}
									>
										<XIcon className="size-3" />
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

				<DialogFooter>
					<Button disabled={!canSubmit} onClick={() => void handleSubmit()}>
						{isUploading || isSubmitting ? <Spinner /> : null}
						{marksDone ? "Mark done" : "Submit"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
