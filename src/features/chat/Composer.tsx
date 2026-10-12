import type { Id } from "@convex/_generated/dataModel";
import { mentionToken, parseMentions } from "@convex/shared/mentions";
import { MAX_MESSAGE_IMAGES, TEXT } from "@convex/shared/limits";
import { ImageIcon, SendIcon, XIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { useUpload } from "~/lib/useUpload";
import { pickImages } from "~/lib/images";
import { isSendKey } from "~/features/work/board/keys";
import { errorMessage } from "~/lib/errors";
import { cn } from "~/lib/utils";
import { useMentionCards } from "./useMentionCards";
import { MentionPicker } from "./MentionPicker";

/** The most Cards the picker lists at once. */
const MAX_OPTIONS = 8;

type Picture = {
	readonly key: string;
	readonly previewUrl: string;
	/** `null` while the file is still uploading. */
	readonly storageId: Id<"_storage"> | null;
};

/** The `#query` being typed right before the caret, if any. */
function findTrigger(text: string, caret: number) {
	const match = text.slice(0, caret).match(/(?:^|\s)#([^\s#]*)$/);
	if (!match) return null;
	return { start: caret - match[1].length - 1, query: match[1] };
}

/** Write a message: text, pasted or dropped images, and in Team `#` to mention a Card. */
export function Composer({
	onSend,
	placeholder,
	mentionStartupId,
}: {
	/** "Message Team", "Message Everyone". */
	readonly placeholder: string;
	readonly onSend: (body: string, images: Id<"_storage">[]) => Promise<boolean>;
	/** The Board whose Cards `#` mentions. Team threads only. */
	readonly mentionStartupId?: Id<"startups">;
}) {
	const cards = useMentionCards(mentionStartupId);
	const { upload } = useUpload();
	const [text, setText] = useState("");
	const [caret, setCaret] = useState(0);
	const [dismissedAt, setDismissedAt] = useState<number | null>(null);
	const [activeId, setActiveId] = useState("");
	const [pictures, setPictures] = useState<Picture[]>([]);
	const [isSending, setIsSending] = useState(false);
	const [isDragOver, setIsDragOver] = useState(false);
	const textarea = useRef<HTMLTextAreaElement>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	const picturesRef = useRef<Picture[]>([]);
	picturesRef.current = pictures;

	const isUploading = pictures.some((picture) => picture.storageId === null);
	const canSend =
		(text.trim().length > 0 || pictures.length > 0) &&
		!isUploading &&
		!isSending;

	const trigger = findTrigger(text, caret);
	const query = trigger?.query.toLowerCase() ?? "";
	const options =
		trigger && trigger.start !== dismissedAt
			? (cards ?? [])
					.filter((card) => card.title.toLowerCase().includes(query))
					.slice(0, MAX_OPTIONS)
			: [];
	const isPickerOpen = options.length > 0;
	const active = options.find((o) => o._id === activeId) ?? options[0];
	const mentioned = parseMentions(text).flatMap((id) => {
		const card = cards?.find((c) => c._id === id);
		return card ? [card] : [];
	});

	// Grow with the text up to about six lines, where browsers lack field-sizing.
	// biome-ignore lint/correctness/useExhaustiveDependencies: resize when the text changes
	useLayoutEffect(() => {
		const el = textarea.current;
		if (!el || CSS.supports("field-sizing", "content")) return;
		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	}, [text]);

	// Thumbnails hold object URLs; free them when the composer goes.
	useEffect(
		() => () => {
			for (const picture of picturesRef.current) {
				URL.revokeObjectURL(picture.previewUrl);
			}
		},
		[],
	);

	function addImages(files: File[]) {
		const { accepted, skipped } = pickImages(
			files,
			MAX_MESSAGE_IMAGES - pictures.length,
		);
		if (skipped > 0) toast(`Images only, up to ${MAX_MESSAGE_IMAGES}.`);

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

	function pick(option: { readonly _id: string }) {
		if (!trigger) return;
		const inserted = `${mentionToken(option._id)} `;
		const next = text.slice(0, trigger.start) + inserted + text.slice(caret);
		const nextCaret = trigger.start + inserted.length;
		setText(next);
		setCaret(nextCaret);
		requestAnimationFrame(() => {
			textarea.current?.focus();
			textarea.current?.setSelectionRange(nextCaret, nextCaret);
		});
	}

	function moveActive(step: 1 | -1) {
		const index = options.findIndex((o) => o._id === active?._id);
		const next = options[(index + step + options.length) % options.length];
		setActiveId(next._id);
	}

	async function handleSend() {
		if (!canSend) return;
		// Clear first, so what's typed while sending is kept and not erased after.
		const sentText = text;
		const sentPictures = pictures;
		const images = sentPictures.flatMap((p) =>
			p.storageId ? [p.storageId] : [],
		);
		setIsSending(true);
		setText("");
		setCaret(0);
		setPictures((current) =>
			current.filter((p) => !sentPictures.some((sent) => sent.key === p.key)),
		);
		textarea.current?.focus();

		const isSent = await onSend(sentText.trim(), images);
		setIsSending(false);
		if (isSent) {
			for (const picture of sentPictures)
				URL.revokeObjectURL(picture.previewUrl);
			return;
		}

		// Put it back, ahead of anything typed or added since.
		setText((current) =>
			current ? `${sentText} ${current}`.slice(0, TEXT.message) : sentText,
		);
		setPictures((current) => {
			const all = [...sentPictures, ...current];
			for (const extra of all.slice(MAX_MESSAGE_IMAGES)) {
				URL.revokeObjectURL(extra.previewUrl);
			}
			return all.slice(0, MAX_MESSAGE_IMAGES);
		});
	}

	return (
		<section
			aria-label="Message Team"
			className="relative shrink-0 px-3 pb-3"
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
			{isPickerOpen ? (
				<MentionPicker
					options={options}
					activeId={active?._id ?? ""}
					onActiveChange={setActiveId}
					onPick={pick}
				/>
			) : null}

			<div
				className={cn(
					"flex flex-col rounded-lg border border-input bg-background transition-[border-color,box-shadow] focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/60",
					isDragOver && "border-ring ring-2 ring-ring/60",
				)}
			>
				{mentioned.length > 0 ? (
					<ul className="flex flex-wrap gap-1.5 px-3 pt-2.5">
						{mentioned.map((card) => (
							<li
								key={card._id}
								className="max-w-full truncate rounded-md bg-muted px-1.5 text-xs"
							>
								# {card.title}
							</li>
						))}
					</ul>
				) : null}

				{pictures.length > 0 ? (
					<ul className="flex flex-wrap gap-2 px-3 pt-3">
						{pictures.map((picture) => (
							<li
								key={picture.key}
								className="relative size-14 overflow-hidden rounded-md border border-border"
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

				<Textarea
					ref={textarea}
					aria-label="Message"
					aria-haspopup="listbox"
					aria-expanded={isPickerOpen}
					aria-controls={isPickerOpen ? "mention-picker" : undefined}
					placeholder={placeholder}
					rows={1}
					maxLength={TEXT.message}
					value={text}
					className="max-h-36 min-h-10 resize-none border-0 bg-transparent px-3 pt-2.5 pb-1 focus-visible:ring-0"
					onChange={(e) => {
						setText(e.target.value);
						setCaret(e.target.selectionStart);
					}}
					onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
					onKeyDown={(e) => {
						const native = e.nativeEvent;
						if (isPickerOpen && !native.isComposing) {
							if (e.key === "ArrowDown" || e.key === "ArrowUp") {
								e.preventDefault();
								moveActive(e.key === "ArrowDown" ? 1 : -1);
								return;
							}
							if (isSendKey(native) || e.key === "Tab") {
								e.preventDefault();
								if (active) pick(active);
								return;
							}
							if (e.key === "Escape") {
								e.preventDefault();
								e.stopPropagation();
								setDismissedAt(trigger?.start ?? null);
								return;
							}
						}
						if (isSendKey(native)) {
							e.preventDefault();
							void handleSend();
						}
					}}
				/>
				<input
					ref={fileInput}
					type="file"
					accept="image/*"
					multiple
					hidden
					onChange={(e) => {
						addImages([...(e.target.files ?? [])]);
						e.target.value = "";
					}}
				/>
				<div className="flex items-center gap-1 px-1.5 pb-1.5">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Add image"
						disabled={pictures.length >= MAX_MESSAGE_IMAGES}
						onClick={() => fileInput.current?.click()}
					>
						<ImageIcon />
					</Button>
					<span className="hidden text-xs text-subtle-foreground md:inline">
						# to mention a Card
					</span>
					<Button
						type="button"
						size="icon-sm"
						variant={canSend ? "default" : "ghost"}
						aria-label="Send"
						className="ml-auto"
						disabled={!canSend}
						onClick={() => void handleSend()}
					>
						{isUploading || isSending ? <Spinner /> : <SendIcon />}
					</Button>
				</div>
			</div>
		</section>
	);
}
