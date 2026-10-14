import { describe, expect, it } from "vitest";
import { Route } from "~/routes/_shell/_authed/home";
import { HomePage } from "./HomePage";

describe("home route", () => {
	it("renders Home", () => {
		expect(Route.options.component).toBe(HomePage);
	});
});
