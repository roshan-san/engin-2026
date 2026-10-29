import { XIcon } from "lucide-react";
import type { Picture } from "~/shared/lib/usePictures";
import { Spinner } from "~/shared/ui/spinner";

/** Thumbnails of the images attached to a message, each with a remove button. */
export function PictureStrip({
	pictures,
	onRemove,
}: {
	readonly pictures: readonly Picture[];
	readonly onRemove: (picture: Picture) => void;
}) {
	return (
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
						className="absolute top-0 right-0 flex size-8 items-start justify-end p-0.5 focus-ring"
						onClick={() => onRemove(picture)}
					>
						<XIcon className="size-4 rounded-full bg-background/80 p-0.5 hover:bg-background" />
					</button>
				</li>
			))}
		</ul>
	);
}
