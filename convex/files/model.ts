import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/** Serving URLs for stored images, skipping any that are gone. */
export async function loadImageUrls(
	ctx: QueryCtx | MutationCtx,
	images: Id<"_storage">[],
): Promise<string[]> {
	const urls = await Promise.all(images.map((id) => ctx.storage.getUrl(id)));
	return urls.filter((url): url is string => url !== null);
}
