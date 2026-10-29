import { describe, expect, it } from "vitest";
import { type ApplicantRow, sortApplicants } from "./applicantSort";

function row(
	name: string,
	status: ApplicantRow["application"]["status"],
	rating: number,
	at: number,
): ApplicantRow {
	return {
		application: {
			_id: name as ApplicantRow["application"]["_id"],
			_creationTime: at,
			status,
		},
		user: { name, rating },
	} as ApplicantRow;
}

const ana = row("ana", "applied", 1000, 3);
const ben = row("ben", "participating", 900, 1);
const cal = row("cal", "applied", 1200, 2);
const dee = row("dee", "declined", 1300, 4);
const eve = row("eve", "applied", 1200, 5);

const names = (rows: ApplicantRow[]) => rows.map((r) => r.user.name);

describe("sortApplicants", () => {
	it("Participants first, then Applicants, then the declined; newest first", () => {
		expect(names(sortApplicants([ana, ben, cal, dee, eve], "newest"))).toEqual([
			"ben",
			"eve",
			"ana",
			"cal",
			"dee",
		]);
	});

	it("by Rating, highest first, and a tie goes to the newest", () => {
		expect(names(sortApplicants([ana, ben, cal, dee, eve], "rating"))).toEqual([
			"ben",
			"eve",
			"cal",
			"ana",
			"dee",
		]);
	});
});
