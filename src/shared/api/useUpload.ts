import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

/** Uploads a file to Convex storage and resolves its id. */
export function useUpload() {
	const generateUploadUrl = useMutation(api.files.files.generateUploadUrl);

	async function upload(file: File): Promise<Id<"_storage">> {
		const url = await generateUploadUrl({});
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": file.type },
			body: file,
		});
		if (!response.ok) {
			throw new Error("Upload failed");
		}
		const { storageId } = (await response.json()) as {
			storageId: Id<"_storage">;
		};
		return storageId;
	}

	return { upload };
}
