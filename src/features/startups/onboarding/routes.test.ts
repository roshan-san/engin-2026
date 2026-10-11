import { describe, expect, it } from "vitest";
import { Route } from "~/routes/_shell/_authed/onboarding";
import { OnboardingFlow } from "./OnboardingFlow";

describe("onboarding route", () => {
	it("renders the onboarding flow", () => {
		expect(Route.options.component).toBe(OnboardingFlow);
	});
});
