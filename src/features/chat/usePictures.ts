import type { Id } from "@convex/_generated/dataModel";
import { MAX_MESSAGE_IMAGES } from "@convex/shared/limits";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";
import { pickImages } from "~/lib/images";
import { useUpload } from "~/lib/useUpload";

export type Picture = {
	readonly key: string;
	readonly previewUrl: string;
	/** `null` while the file is still uploading. */
	readonly storageId: Id<"_storage"> | null;
};

/** The images attached to a message: upload on add, free the previews, put them back if a send fails. */
export function usePictures() {
	const { upload } = useUpload();
	const [pictures, setPictures] = useState<Picture[]>([]);
	const picturesRef = useRef<Picture[]>([]);
	picturesRef.current = pictures;

	const isUploading = pictures.some((picture) => picture.storageId === null);

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
			for (const extra of all.slice(MAX_MESSAGE_IMAGES)) {
				URL.revokeObjectURL(extra.previewUrl);
			}
			return all.slice(0, MAX_MESSAGE_IMAGES);
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
