import { describe, expect, it } from "vitest";
import { Route } from "~/routes/_shell/_authed/s/$slug/settings";
import { SettingsPage } from "./SettingsPage";

describe("settings route", () => {
	it("renders the Startup settings page", () => {
		expect(Route.options.component).toBe(SettingsPage);
	});
});
