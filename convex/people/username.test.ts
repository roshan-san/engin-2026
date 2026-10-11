import { describe, expect, test } from "vitest";
import { buildUsernameBase, requireUsername } from "./username.rules";

describe("buildUsernameBase", () => {
	test("a name becomes a lowercase handle", () =>
		expect(buildUsernameBase("Priya Sharma", undefined)).toBe("priya_sharma"));

	test("no name falls back to the email's local part", () =>
		expect(buildUsernameBase(undefined, "Fay.Lee+x@example.com")).toBe(
			"fay_lee_x",
		));

	test("leading digits are dropped", () =>
		expect(buildUsernameBase("007 Bond", undefined)).toBe("bond"));

	test("a name with no usable letters becomes builder", () =>
		expect(buildUsernameBase("李雷", undefined)).toBe("builder"));

	test("a reserved word becomes builder", () =>
		expect(buildUsernameBase(undefined, "admin@example.com")).toBe("builder"));

	test("a long name is cut to 16 characters", () =>
		expect(buildUsernameBase("Bartholomew Montgomery", undefined)).toBe(
			"bartholomew_mont",
		));

	test("every base passes requireUsername", () => {
		for (const name of ["李雷", "a", "Ab", "__x__", "Zoë Q"])
			expect(() =>
				requireUsername(buildUsernameBase(name, undefined)),
			).not.toThrow();
	});
});
