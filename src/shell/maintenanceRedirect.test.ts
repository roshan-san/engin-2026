import { describe, expect, it } from "vitest";
import { Route as MaintenanceRoute } from "~/routes/maintenance";
import { MaintenancePage } from "~/shell/MaintenancePage";
import { maintenanceRedirect } from "./maintenanceRedirect";

describe("maintenance redirect", () => {
	it("any page sends you to /maintenance while maintenance is on", () => {
		expect(maintenanceRedirect(true, "/")).toBe("/maintenance");
		expect(maintenanceRedirect(true, "/explore/hackathons")).toBe(
			"/maintenance",
		);
	});

	it("/maintenance stays put while maintenance is on", () => {
		expect(maintenanceRedirect(true, "/maintenance")).toBeNull();
	});

	it("/maintenance sends you home once maintenance is off", () => {
		expect(maintenanceRedirect(false, "/maintenance")).toBe("/");
	});

	it("other pages stay put while maintenance is off", () => {
		expect(maintenanceRedirect(false, "/explore/hackathons")).toBeNull();
	});

	it("the /maintenance route renders the maintenance page", () => {
		expect(MaintenanceRoute.options.component).toBe(MaintenancePage);
	});
});
