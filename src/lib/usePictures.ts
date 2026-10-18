import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "./errors";
import { pickImages } from "./images";
import { useUpload } from "./useUpload";

export type Picture = {
	readonly key: string;
	readonly previewUrl: string;
	/** `null` while the file is still uploading. */
	readonly storageId: Id<"_storage"> | null;
};

/**
 * Images attached to a form, at most `max`: upload on add, free the previews, put them back
 * if a send fails. `skippedMessage` is toasted when a file isn't an image or doesn't fit.
 */
export function usePictures({
	max,
	skippedMessage,
}: {
	readonly max: number;
	readonly skippedMessage: string;
}) {
	const { upload } = useUpload();
	const [pictures, setPictures] = useState<Picture[]>([]);
	const picturesRef = useRef<Picture[]>([]);
	picturesRef.current = pictures;

	const isUploading = pictures.some((picture) => picture.storageId === null);

	// Thumbnails hold object URLs; free them when the form goes.
	useEffect(
		() => () => {
			for (const picture of picturesRef.current) {
				URL.revokeObjectURL(picture.previewUrl);
			}
		},
		[],
	);

	function addImages(files: File[]) {
		const { accepted, skipped } = pickImages(files, max - pictures.length);
		if (skipped > 0) toast(skippedMessage);

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

	/** Remove the current pictures and return them, to send. */
	function take() {
		const taken = pictures;
		setPictures((current) =>
			current.filter((p) => !taken.some((sent) => sent.key === p.key)),
		);
		return taken;
	}

	/** Put pictures back, ahead of anything added since. */
	function restore(sent: Picture[]) {
		setPictures((current) => {
			const all = [...sent, ...current];
			for (const extra of all.slice(max)) {
				URL.revokeObjectURL(extra.previewUrl);
			}
			return all.slice(0, max);
		});
	}

	/** Free the previews of pictures that were sent. */
	function release(sent: Picture[]) {
		for (const picture of sent) URL.revokeObjectURL(picture.previewUrl);
	}

	return {
		pictures,
		isUploading,
		addImages,
		removePicture,
		take,
		restore,
		release,
	};
}
