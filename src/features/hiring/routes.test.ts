import { describe, expect, it } from "vitest";
import { Route as BuilderBriefRoute } from "~/routes/_shell/_authed/h/$id/brief";
import { Route as BuilderBoardRoute } from "~/routes/_shell/_authed/h/$id/index";
import { Route as BuilderLayoutRoute } from "~/routes/_shell/_authed/h/$id/route";
import { Route as SpaceRoute } from "~/routes/_shell/_authed/s/$slug/hiring/$id";
import { Route as HiringRoute } from "~/routes/_shell/_authed/s/$slug/hiring/index";
import { Route as NewRoute } from "~/routes/_shell/_authed/s/$slug/hiring/new";
import { Route as HackathonRoute } from "~/routes/_shell/hackathons/$id";
import { BriefPage } from "./builder/BriefPage";
import { BuilderGate } from "./builder/BuilderGate";
import { BuilderPage } from "./builder/BuilderPage";
import { NewHackathonPage } from "./form/NewHackathonPage";
import { HiringPage } from "./list/HiringPage";
import { HackathonPage } from "./public/HackathonPage";
import { SpacePage } from "./space/SpacePage";

describe("hiring routes", () => {
	it("each route renders its page", () => {
		expect(HiringRoute.options.component).toBe(HiringPage);
		expect(NewRoute.options.component).toBe(NewHackathonPage);
		expect(SpaceRoute.options.component).toBe(SpacePage);
		expect(HackathonRoute.options.component).toBe(HackathonPage);
		expect(BuilderLayoutRoute.options.component).toBe(BuilderGate);
		expect(BuilderBoardRoute.options.component).toBe(BuilderPage);
		expect(BuilderBriefRoute.options.component).toBe(BriefPage);
	});
});
