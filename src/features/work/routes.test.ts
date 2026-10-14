import { describe, expect, it } from "vitest";
import { Route as ActivityRoute } from "~/routes/_shell/_authed/s/$slug/activity";
import { Route as BoardRoute } from "~/routes/_shell/_authed/s/$slug/board";
import { ActivityPage } from "./activity/ActivityPage";
import { WorkspacePage } from "./board/WorkspacePage";

describe("work routes", () => {
	it("each route renders its page", () => {
		expect(BoardRoute.options.component).toBe(WorkspacePage);
		expect(ActivityRoute.options.component).toBe(ActivityPage);
	});
});
