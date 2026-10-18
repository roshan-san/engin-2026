import type { Id } from "@convex/_generated/dataModel";
import { MAX_MESSAGE_IMAGES, TEXT } from "@convex/shared/limits";
import { mentionToken } from "@convex/shared/mentions";
import { ImageIcon, SendIcon } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { isSendKey } from "~/features/work/board/keys";
import { isCoarsePointer } from "~/lib/platform";
import { cn } from "~/lib/utils";
import { MentionPicker } from "./MentionPicker";
import { PictureStrip } from "./PictureStrip";
import { useMentions } from "./useMentions";
import { usePictures } from "./usePictures";

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
	const [text, setText] = useState("");
	const [caret, setCaret] = useState(0);
	const [isSending, setIsSending] = useState(false);
	const [isDragOver, setIsDragOver] = useState(false);
	const textarea = useRef<HTMLTextAreaElement>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	const {
		trigger,
		options,
		isPickerOpen,
		active,
		setActiveId,
		mentioned,
		moveActive,
		dismiss,
	} = useMentions({ startupId: mentionStartupId, text, caret });
	const {
		pictures,
		isUploading,
		addImages,
		removePicture,
		take,
		restore,
		release,
	} = usePictures();

	const canSend =
		(text.trim().length > 0 || pictures.length > 0) &&
		!isUploading &&
		!isSending;

	// Grow with the text up to about six lines, where browsers lack field-sizing.
	// biome-ignore lint/correctness/useExhaustiveDependencies: resize when the text changes
	useLayoutEffect(() => {
		const el = textarea.current;
		if (!el || CSS.supports("field-sizing", "content")) return;
		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	}, [text]);

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

	async function handleSend() {
		if (!canSend) return;
		// Clear first, so what's typed while sending is kept and not erased after.
		const sentText = text;
		setIsSending(true);
		setText("");
		setCaret(0);
		const sentPictures = take();
		const images = sentPictures.flatMap((p) =>
			p.storageId ? [p.storageId] : [],
		);
		textarea.current?.focus();

		const isSent = await onSend(sentText.trim(), images);
		setIsSending(false);
		if (isSent) {
			release(sentPictures);
			return;
		}

		// Put it back, ahead of anything typed or added since.
		setText((current) =>
			current ? `${sentText} ${current}`.slice(0, TEXT.message) : sentText,
		);
		restore(sentPictures);
	}

	return (
		<section
			aria-label={placeholder}
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
					<PictureStrip pictures={pictures} onRemove={removePicture} />
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
								dismiss();
								return;
							}
						}
						// On a phone Enter is a newline; the Send button (or Cmd/Ctrl+Enter) sends.
						if (isSendKey(native, { coarse: isCoarsePointer() })) {
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
					{mentionStartupId ? (
						<span className="hidden text-xs text-subtle-foreground md:inline">
							# to mention a Card
						</span>
					) : null}
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
