import { describe, it, expect } from "vitest";
import { computeSnapped } from "@/utils/dial";

describe("computeSnapped", () => {
	it("returns unclamped when snap disabled", () => {
		const r = computeSnapped(42.3, null, { snap: false });
		expect(r.value).toBeCloseTo(42.3, 5);
		// changed reflects bucket change; for snap disabled we treat as unchanged
		expect(r.changed).toBe(false);
	});
	it("snaps to nearest interval", () => {
		const r = computeSnapped(42.3, null, { snap: true, step: 5 });
		expect(r.value).toBe(40); // 42.3 rounds to 40 with step=5
	});
	it("clamps within 0-100", () => {
		const rLow = computeSnapped(-10, null, { snap: true, step: 5 });
		const rHigh = computeSnapped(140, null, { snap: true, step: 5 });
		expect(rLow.value).toBe(0);
		expect(rHigh.value).toBe(100);
	});
	it("handles floating step values", () => {
		const r = computeSnapped(37, null, { snap: true, step: 2.5 }); // 37 /2.5 = 14.8 -> rounds to 15 * 2.5 = 37.5
		expect(r.value).toBeCloseTo(37.5, 5);
	});
	it("changed flag only when bucket differs from last", () => {
		const first = computeSnapped(21, null, { snap: true, step: 10 }); // bucket=20
		const second = computeSnapped(24, first.value, { snap: true, step: 10 }); // still bucket=20
		expect(first.changed).toBe(true);
		expect(second.changed).toBe(false);
		const third = computeSnapped(29, second.value, { snap: true, step: 10 }); // still bucket=30? Actually 29 rounds to 30 so changed
		expect(third.changed).toBe(true);
	});
});
