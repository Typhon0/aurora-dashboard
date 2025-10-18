import { describe, it, expect } from "vitest";

// Simple replica of overshoot spring step logic to ensure stability characteristics.
function stepOvershoot(
	value: number,
	velocity: number,
	targetLow = 0,
	targetHigh = 100,
	overshootLimit = 8,
) {
	// clamp hard limits
	if (value < -overshootLimit) value = -overshootLimit;
	if (value > 100 + overshootLimit) value = 100 + overshootLimit;
	if (value < targetLow) {
		const spring = (targetLow - value) * 0.12;
		velocity += spring;
	} else if (value > targetHigh) {
		const spring = (targetHigh - value) * 0.12;
		velocity += spring;
	}
	return { value, velocity };
}

describe("overshoot spring", () => {
	it("springs back toward bounds", () => {
		let v = 120; // start beyond high
		let vel = 0;
		for (let i = 0; i < 30; i++) {
			const r = stepOvershoot(v, vel);
			v = r.value + r.velocity / 60; // integrate approx
			vel = r.velocity * 0.92; // friction
		}
		expect(v).toBeLessThan(110); // should head back
	});
	it("respects overshoot hard cap", () => {
		const r = stepOvershoot(150, 0, 0, 100, 8);
		expect(r.value).toBeLessThanOrEqual(108);
	});
});
