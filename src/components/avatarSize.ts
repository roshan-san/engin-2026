/** The avatar sizes, in pixels, shared by people and places. */
export const AVATAR_SIZE = {
	16: "size-4",
	20: "size-5",
	24: "size-6",
	32: "size-8",
	40: "size-10",
	64: "size-16",
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZE;
