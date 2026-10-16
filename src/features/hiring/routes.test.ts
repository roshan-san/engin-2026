import { describe, expect, it } from "vitest";
import { Route as ParticipantBriefRoute } from "~/routes/_shell/_authed/h/$id/brief";
import { Route as ParticipantBoardRoute } from "~/routes/_shell/_authed/h/$id/index";
import { Route as ParticipantLayoutRoute } from "~/routes/_shell/_authed/h/$id/route";
import { Route as SpaceRoute } from "~/routes/_shell/_authed/s/$slug/hiring/$id";
import { Route as HiringRoute } from "~/routes/_shell/_authed/s/$slug/hiring/index";
import { Route as NewRoute } from "~/routes/_shell/_authed/s/$slug/hiring/new";
import { Route as HackathonRoute } from "~/routes/_shell/hackathons/$id";
import { NewHackathonPage } from "./form/NewHackathonPage";
import { HiringPage } from "./list/HiringPage";
import { BriefPage } from "./participant/BriefPage";
import { ParticipantGate } from "./participant/ParticipantGate";
import { ParticipantPage } from "./participant/ParticipantPage";
import { HackathonPage } from "./public/HackathonPage";
import { SpacePage } from "./space/SpacePage";

describe("hiring routes", () => {
	it("each route renders its page", () => {
		expect(HiringRoute.options.component).toBe(HiringPage);
		expect(NewRoute.options.component).toBe(NewHackathonPage);
		expect(SpaceRoute.options.component).toBe(SpacePage);
		expect(HackathonRoute.options.component).toBe(HackathonPage);
		expect(ParticipantLayoutRoute.options.component).toBe(ParticipantGate);
		expect(ParticipantBoardRoute.options.component).toBe(ParticipantPage);
		expect(ParticipantBriefRoute.options.component).toBe(BriefPage);
	});
});
