import { describe, expect, it } from "vitest";
import { vapidKeyBytes } from "./vapidKey";

describe("vapidKeyBytes", () => {
	it("decodes URL-safe base64 without padding", () => {
		// "hi?" in base64 is "aGk/", URL-safe "aGk_".
		expect(Array.from(vapidKeyBytes("aGk_"))).toEqual([104, 105, 63]);
		expect(Array.from(vapidKeyBytes("aGk"))).toEqual([104, 105]);
	});
});
