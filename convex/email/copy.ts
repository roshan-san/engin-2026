// Pure copy: each email's subject and text. Links are passed in, so these stay testable.

type Hackathon = { startupName: string; jobTitle: string };
type Copy = { subject: string; text: string };

/** "Mon, 9 Nov" in India time. */
export function emailDay(at: number): string {
	return new Date(at).toLocaleDateString("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "Asia/Kolkata",
	});
}

export function acceptedEmail(
	h: Hackathon & { startsAt: number; confirmBy: number | null; url: string },
): Copy {
	const confirm =
		h.confirmBy === null
			? ""
			: `\nConfirm your place by ${emailDay(h.confirmBy)}, or it goes to someone else.`;
	return {
		subject: `You're in: ${h.jobTitle} at ${h.startupName}`,
		text: `${h.startupName} picked you as a Builder for their ${h.jobTitle} Hackathon. It starts ${emailDay(h.startsAt)}.${confirm}\n\n${h.url}`,
	};
}

export function notSelectedEmail(h: Hackathon & { url: string }): Copy {
	return {
		subject: `Not selected for this one: ${h.jobTitle} at ${h.startupName}`,
		text: `${h.startupName} picked their Builders for the ${h.jobTitle} Hackathon, and you weren't one of them this time. Thanks for applying.\n\nMore Hackathons: ${h.url}`,
	};
}

export function notThisTimeEmail(
	h: Hackathon & { note: string; url: string },
): Copy {
	return {
		subject: `Not this time: ${h.jobTitle} at ${h.startupName}`,
		text: `${h.startupName} has decided on the ${h.jobTitle} Hackathon. Their note for you:\n\n“${h.note}”\n\nYour approved Cards stay on your Record.\n\n${h.url}`,
	};
}

export function offerEmail(
	h: Hackathon & { terms: string; expiresAt: number; url: string },
): Copy {
	return {
		subject: `Offer from ${h.startupName}`,
		text: `${h.startupName} has made you an Offer after the ${h.jobTitle} Hackathon:\n\n${h.terms}\n\nAccept or decline by ${emailDay(h.expiresAt)}: ${h.url}`,
	};
}

export function teamInviteEmail(i: {
	startupName: string;
	inviterName: string;
	url: string;
}): Copy {
	return {
		subject: `Join ${i.startupName} on engin`,
		text: `${i.inviterName} invited you to ${i.startupName}'s team on engin. Sign in with Google using this email address to join:\n\n${i.url}`,
	};
}

export function cardSentBackEmail(c: {
	cardTitle: string;
	startupName: string;
	url: string;
}): Copy {
	return {
		subject: `Sent back: ${c.cardTitle}`,
		text: `Your Card “${c.cardTitle}” at ${c.startupName} was sent back. See what's needed and send it again:\n\n${c.url}`,
	};
}

export function threadMessageEmail(
	h: Hackathon & { fromName: string; body: string; url: string },
): Copy {
	return {
		subject: `${h.fromName} wrote about the ${h.jobTitle} Hackathon`,
		text: `${h.fromName} (${h.startupName}):\n\n${h.body}\n\nReply: ${h.url}`,
	};
}

export function placeReleasedEmail(h: Hackathon & { url: string }): Copy {
	return {
		subject: `Your place was released: ${h.jobTitle} at ${h.startupName}`,
		text: `You didn't confirm your place on ${h.startupName}'s ${h.jobTitle} Hackathon in time, so it went to someone else.\n\nMore Hackathons: ${h.url}`,
	};
}

export function removedEmail(h: Hackathon & { url: string }): Copy {
	return {
		subject: `Removed from ${h.jobTitle} at ${h.startupName}`,
		text: `Your Cards on ${h.startupName}'s ${h.jobTitle} Hackathon hadn't moved, so the Founder removed you.\n\nMore Hackathons: ${h.url}`,
	};
}

export function startingTomorrowEmail(
	h: Hackathon & { startsAt: number; url: string },
): Copy {
	return {
		subject: `Starts tomorrow: ${h.jobTitle} at ${h.startupName}`,
		text: `${h.startupName}'s ${h.jobTitle} Hackathon starts ${emailDay(h.startsAt)}. Your Cards arrive on your Board then.\n\n${h.url}`,
	};
}

export function decisionDeadlineEmail(
	h: Hackathon & { undecided: number; decideBy: number; url: string },
): Copy {
	const who =
		h.undecided === 1 ? "1 Builder is" : `${h.undecided} Builders are`;
	return {
		subject: `Decide by ${emailDay(h.decideBy)}: ${who} waiting`,
		text: `${who} waiting to hear back on your ${h.jobTitle} Hackathon. Decide by ${emailDay(h.decideBy)}; anyone undecided then gets Not this time, and your record shows you didn't decide.\n\n${h.url}`,
	};
}

export function newApplicantsEmail(
	h: Hackathon & { count: number; url: string },
): Copy {
	const who = h.count === 1 ? "1 new Applicant" : `${h.count} new Applicants`;
	return {
		subject: `${who} for ${h.jobTitle}`,
		text: `${who} applied to your ${h.jobTitle} Hackathon. Accept up to 10 before it starts.\n\n${h.url}`,
	};
}

export function mondayReminderEmail(s: {
	startupName: string;
	url: string;
}): Copy {
	return {
		subject: `Start the week at ${s.startupName}`,
		text: `The Board at ${s.startupName} is still locked. After the opening meeting, once everyone has a Card for the week, press Start the week.\n\n${s.url}`,
	};
}
