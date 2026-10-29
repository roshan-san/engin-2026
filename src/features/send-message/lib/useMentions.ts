import type { Id } from "@convex/_generated/dataModel";
import { parseMentions } from "@convex/shared/mentions";
import { useState } from "react";
import { useMentionCards } from "~/entities/card";
import { findTrigger } from "../model/mentionTrigger";

/** The most Cards the picker lists at once. */
const MAX_OPTIONS = 8;

/** The `#` Card picker: what's being typed, the matching Cards, and which is active. */
export function useMentions({
	startupId,
	text,
	caret,
}: {
	startupId: Id<"startups"> | undefined;
	text: string;
	caret: number;
}) {
	const cards = useMentionCards(startupId);
	const [dismissedAt, setDismissedAt] = useState<number | null>(null);
	const [activeId, setActiveId] = useState("");

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

	function moveActive(step: 1 | -1) {
		const index = options.findIndex((o) => o._id === active?._id);
		const next = options[(index + step + options.length) % options.length];
		setActiveId(next._id);
	}

	function dismiss() {
		setDismissedAt(trigger?.start ?? null);
	}

	return {
		trigger,
		options,
		isPickerOpen,
		active,
		setActiveId,
		mentioned,
		moveActive,
		dismiss,
	};
}
