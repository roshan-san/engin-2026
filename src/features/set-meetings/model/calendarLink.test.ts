import { describe, expect, it } from "vitest";
import { calendarLink } from "./calendarLink";

describe("calendarLink", () => {
	it("opens a weekly Google Calendar event with the team as guests", () => {
		const url = new URL(
			calendarLink({
				title: "engin · Opening · Acme",
				startsAt: Date.parse("2026-11-09T04:30:00Z"),
				endsAt: Date.parse("2026-11-09T05:15:00Z"),
				day: "MO",
				guests: ["a@x.com", "b@y.com"],
				details: "https://engin.app/s/acme/cycle",
			}),
		);

		expect(`${url.origin}${url.pathname}`).toBe(
			"https://calendar.google.com/calendar/render",
		);
		expect(url.searchParams.get("action")).toBe("TEMPLATE");
		expect(url.searchParams.get("text")).toBe("engin · Opening · Acme");
		expect(url.searchParams.get("dates")).toBe(
			"20261109T043000Z/20261109T051500Z",
		);
		expect(url.searchParams.get("ctz")).toBe("Asia/Kolkata");
		expect(url.searchParams.get("recur")).toBe("RRULE:FREQ=WEEKLY;BYDAY=MO");
		expect(url.searchParams.get("add")).toBe("a@x.com,b@y.com");
		expect(url.searchParams.get("details")).toBe(
			"https://engin.app/s/acme/cycle",
		);
	});
});
