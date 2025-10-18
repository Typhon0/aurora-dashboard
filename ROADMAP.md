# Aurora Dashboard Roadmap

This document tracks planned expansion goals beyond core parity.

## Suggested Next Expansion (Post-Parity)

### High-Priority Visual / Data Enhancements
- Energy / Power Flow Composite Card (live consumption vs production, per-phase or per-device breakdown)
- History / Trend Graph (mini sparkline with live updating window)
- Map / Device Tracker Card (presence, zones, vacuum path overlays)
- Battery Summary (low battery aggregation + alert badges)
- Radial Gauge Variant (circular arc with thresholds + glow pulses)

### Card Deep-Dive Enhancements
- Light Card: radial color wheel, color temperature dial, adaptive ambient preview
- Climate Card: dual setpoint (heat/cool) dial, comfort band visualization, humidity overlay
- Fan Card: speed steps with haptic ticks, oscillation + mode chips
- Media Player: queue panel slide-in, blurred album art background, progress inertia scrub
- Vacuum Card: room/zone quick actions, map overlay, cleaning history sparkline
- Binary Sensor: animated attention pulse on activation, timeline of recent state flips

### Global UX / Theming
- Adaptive Glass Tint (derive tint & contrast from entity dominant color)
- Motion Reduced Mode (alt surfaces without heavy blur or parallax)
- Virtualized Entities List (windowed rendering + skeleton shimmer)
- Theming Token Generator CLI (scaffold new semantic palettes quickly)

### Data & Performance
- Cached Entity Trend Buffers for fast sparkline redraw
- Web Worker Offloading for history aggregation & smoothing
- Incremental Streaming of statistics (SSE / WebSocket pipeline adapters)

### Accessiblity & Haptics
- Enhanced ARIA Live Regions for state transitions (alarm, door, security events)
- Soft Haptic Pattern Library (mapping events to vibration patterns where supported)

### Developer Experience
- Card Capability Registry (metadata: supportsToggle, adjustableRange, hasColor, etc.)
- Storybook / Visual Tests for each card variant (glass vs subtle vs high-contrast)
- Snapshot color contrast auditing script

---
## Implementation Order Proposal
1. ECharts integration (shared wrapper + Sparkline component)
2. Sparkline adoption in Gauge and forthcoming Energy card
3. Energy / Power Flow composite (foundation for data aggregation patterns)
4. Radial Gauge + Climate dial unification
5. Map / Device Tracker (introduce mapping library evaluation)
6. Battery Summary + Presence refinements

## Notes
- Prioritize architectural primitives (chart wrapper, data buffer hooks) before building multiple dependent cards.
- Keep each new visualization composable (e.g., sparkline as "inline trend" component reusable inside Sensor, Energy, Battery).

PRs welcome—feel free to annotate this roadmap with links once items land.
