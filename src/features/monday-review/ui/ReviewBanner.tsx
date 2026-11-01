import { useState } from "react";
import { useReview } from "~/entities/cycle";
import { useWorkspace } from "~/entities/startup";
import { Button } from "~/shared/ui/button";
import { ReviewSheet } from "./ReviewSheet";

/** One quiet row while the Founder has a Monday review due. Nothing else on the page waits for it. */
export function ReviewBanner() {
	const { startup } = useWorkspace();
	const review = useReview(startup._id);
	const [isOpen, setIsOpen] = useState(false);

	if (!review) return null;

	return (
		<div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
			<p className="min-w-0 text-sm">
				Monday review: close Cycle {review.number}
			</p>
			<Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
				Review
			</Button>
			<ReviewSheet
				key={review.week}
				startupId={startup._id}
				review={review}
				open={isOpen}
				onOpenChange={setIsOpen}
			/>
		</div>
	);
}
