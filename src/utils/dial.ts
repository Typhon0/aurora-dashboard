export interface SnapOptions {
	snap?: boolean;
	step?: number; // percent interval
	haptics?: boolean; // not used here (handled by component)
	onSnap?: (value: number) => void;
}

// Pure snap calculation (no side effects) returns snapped value and a flag if it changed bucket.
export function computeSnapped(
	value: number,
	last: number | null,
	{ snap = true, step = 1, onSnap }: SnapOptions = {},
): { value: number; changed: boolean; bucket: number } {
	const pct = Math.min(100, Math.max(0, value));
	if (!snap) return { value: pct, changed: false, bucket: pct };
	const interval = Math.max(0.1, step);
	const bucket = Math.round(pct / interval) * interval;
	const clamped = Math.min(100, Math.max(0, bucket));
	const changed = last === null || clamped !== last;
	if (changed) onSnap?.(clamped);
	return { value: clamped, changed, bucket: clamped };
}
