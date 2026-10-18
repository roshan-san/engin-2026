import type { ReactNode } from "react";
import { MentorNote } from "~/components/MentorNote";

/** One numbered part of the form: its label, then its mentor note, then the fields. */
export function Part({
	label,
	note,
	children,
}: {
	readonly label: string;
	readonly note?: string;
	readonly children: ReactNode;
}) {
	return (
		<section className="flex min-w-0 flex-col gap-3">
			<div className="flex flex-col gap-0.5">
				<h2 className="text-lg font-semibold">{label}</h2>
				{note ? <MentorNote>{note}</MentorNote> : null}
			</div>
			{children}
		</section>
	);
}

/** A chip row with its own small label, inside a Part. */
export function Field({
	label,
	children,
}: {
	readonly label: string;
	readonly children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-xs text-muted-foreground">{label}</span>
			{children}
		</div>
	);
}
