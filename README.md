# Aurora Dashboard

Modern Home Assistant dashboard built with React + TypeScript + Vite, Tailwind, shadcn/ui components and a glassmorphic design system.

## Card Parity Matrix

The goal is to reach (and then exceed) feature parity with the prior `ha-component-kit` entity coverage. Below is the current snapshot.

Legend:
- ✅ Present (implemented)
- 🔧 Present + Enhanced (notable UX/visual upgrades vs baseline)
- 🆕 Placeholder (scaffolded; minimal functionality; earmarked for enhancement)
- ⏳ Planned (not yet created)

| Domain / Card | Status | Notes |
|---------------|--------|-------|
| Alarm | ✅ | Alert integration for arming/pending states |
| Area | ✅ | Room aggregate layout |
| Button | ✅ | Stateless service trigger |
| Calendar | ✅ | Basic agenda (enhancements pending) |
| Camera | ✅ | Live still / stream placeholder |
| Climate (Thermostat) | 🔧 | Dial control potential integration forthcoming |
| Cover | ✅ | Open / close positioning planned later |
| Entities (list) | ✅ | Group expansion planned |
| Fab (floating actions) | ✅ | Action clustering |
| Family / Presence | ✅ | Aggregated people entities |
| Fan | ✅ | Speed control enhancement pending |
| Garbage Collection | ✅ | Custom integration support |
| Light | 🔧 | Brightness + color presets + glass actions bar |
| Lock | ✅ | State + action feedback |
| Media Player | 🔧 | Rich transport controls plan (queue, artwork effects) |
| Number / Input Number | ✅ | Direct value editing |
| Picture | ✅ | Static / dynamic media |
| Scene | ✅ | Stateless activation |
| Select / Input Select | ✅ | Options selector |
| Sensor (generic) | ✅ | Base sensor presentation |
| Sidebar | ✅ | Navigation / contextual info |
| Time / Input Datetime | ✅ | Basic time display (editing later) |
| Timer | ✅ | Countdown handling placeholders |
| Trigger (automation) | ✅ | Manual automation trigger |
| Vacuum | ✅ | State + basic command shell |
| Weather | ✅ | Current conditions |
| Switch | 🆕 | Toggle placeholder (service wired) |
| Binary Sensor | 🆕 | Active/inactive visual semantics |
| Gauge (generic numeric) | 🆕 | Threshold styling + progress bar |
| Energy / Power Flow | ⏳ | Planned composite (gauges + spark lines) |
| History / Trend Graph | ⏳ | Planned mini time-series w/ sparkline |
| Map / Device Tracker | ⏳ | Planned (leaflet / maplibre evaluation) |
| Battery Summary | ⏳ | Planned aggregated low-battery list |

### Enhancement Backlog (Post-Parity)

- Light Card: radial color wheel + temperature slider with dial-based fine adjust
- Climate Card: integrate `ControlDial` for setpoint + dual setpoint mode, animated gradient based on delta
- Fan Card: multi-speed + oscillation toggle + haptic tick for speed steps
- Media Player: queue panel slide-in, blurred album art backdrop, progress scrub with momentum
- Gauge Card: arc radial variant + gradient fill + alert pulse above threshold
- History/Trend: GPU-accelerated tiny sparkline (canvas) with live streaming window
- Energy Card: stacked bars + consumption vs production delta glow
- Vacuum Card: map overlay & zone quick actions
- Binary Sensor: animated attention ping when state becomes active
- Global: adaptive glass (dark/light dynamic tinting using perceptual contrast of dominant entity color)
- Accessibility: motion-reduced variant removing heavy blurs, prefer solid subtle surfaces
- Performance: virtualization for large Entities list & skeleton shimmer on load

Have another domain or integration you want surfaced? Open an issue or PR with entity examples.

- Glassmorphism card system with layered gradients & blur
- Light / Dark / System theme switch (persisted)
- Design tokens via CSS variables + Tailwind
- Extensible card variants (CVA)
- Ready for additional semantic color scales

## Theming & Glassmorphism

This dashboard extends shadcn/ui tokens with a reusable glass surface layer.

### Tokens

Core colors (`background`, `foreground`, `card`, `popover`, `border`, `primary`, etc.) live as CSS custom properties in `:root` and `.dark` inside `src/index.css`. Tailwind maps them in `tailwind.config.js` using `hsl(var(--token))`.

### Glass Surface Utility

Class: `.surface-glass`

Provides:

- Adaptive translucent gradient (dark / light)
- Backdrop blur + saturation
- Layered soft shadows + hover elevation
- Radial highlight accents via pseudo-element

Applied automatically by the default `Card` variant (`glass`). Override variant as needed:

```tsx
<Card variant="default">Default (solid)</Card>
<Card variant="glass">Glass</Card>
<Card variant="subtle">Subtle</Card>
```

### Theme Switching

Uses `next-themes` for `light | dark | system`.

- Provider: `src/components/providers/ThemeProvider.tsx` (mounted in `AppProviders.tsx`)
- Toggle: `src/components/ui/theme-toggle.tsx` (placed in the `Dashboard` header)

Programmatic control:

```tsx
import { useTheme } from 'next-themes'
const { theme, setTheme } = useTheme()
setTheme('light') // or 'dark' | 'system'
```

### Adding a Card Variant

Edit `src/components/ui/card.tsx` `cardVariants` and add a key under `variant`:

```ts
gradient: 'relative overflow-hidden border bg-gradient-to-br from-aurora-500/30 to-aurora-700/30 backdrop-blur-md'
```

Then use:

```tsx
<Card variant="gradient" />
```

### Migration Note

Old class `aurora-glass` deprecated → replaced by `.surface-glass` (utility) + `Card` `glass` variant.

### Quick Customization Cheatsheet

- Blur strength: tweak `backdrop-filter` in `.surface-glass`
- Corner radius: change `--radius` in `:root`
- Elevation: adjust `--glass-shadow` & `--glass-shadow-hover`
- Accent hue: extend Tailwind `colors` and reference new tokens

### Extending Semantic Colors

Add new tokens in `:root` / `.dark`, then expose via `tailwind.config.js` `extend.colors`. Use `hsl(var(--your-token))` pattern for consistency.

---

## Development

Install deps (Bun recommended):

```bash
bun install
```

Run dev server:

```bash
bun dev
```

### Demo Mode (Offline Mock Home Assistant)

You can launch Aurora in a zero-config offline demo that mocks a Home Assistant backend using the upstream `hass-connect-fake` implementation (entity store + services + drifting state updates).

Why this approach?

- No conditional logic in card components
- Real `@hakit/core` APIs (hooks/selectors) – exercised exactly as production
- Automatic fake entities covering lights, media players, climate, weather, covers, scenes, sensors, vacuum, alarm, persons, etc.

Enable demo mode via an environment variable consumed by Vite:

```bash
VITE_DEMO=1 bun dev
```

Or use the convenience script:

```bash
bun demo
```

What it does internally:

- `vite.config.ts` conditionally aliases `@hakit/core` to `./ha-component-kit/hass-connect-fake/index.tsx` when `VITE_DEMO=1`
- `App.tsx` checks `import.meta.env.VITE_DEMO` and renders `DemoDashboard` (a curated gallery of all Aurora cards)
- No network calls to a real Home Assistant instance are made

Adding / adjusting demo entities:

- Source for fake entities lives in: `ha-component-kit/hass-connect-fake/mocks/mockEntities.ts`
- Update or extend mocks there; restart dev server to reflect changes
- If you add entirely new domains, ensure the factory (e.g. `createLight`) exists or mirror an existing one

Limitations / placeholders:

- Some placeholder entity ids in `DemoDashboard.tsx` (e.g. fan, lock, number, select, timer) are not yet present in the upstream fake set – those cards will show fallback or error until mocks are added
- Service side effects are simulated in-memory only

Exiting demo mode:

```bash
bun dev # (without VITE_DEMO)
```

Connecting to a real Home Assistant later:

1. Set environment variables (e.g. in `.env.local`):

- `VITE_HA_URL=https://your-ha-instance`
- `VITE_HA_TOKEN=LONG_LIVED_ACCESS_TOKEN`

2. Run `bun dev` (ensure `VITE_DEMO` is NOT set)

3. `App` will mount `HassConnect` and render `Dashboard`

Troubleshooting:

- If cards show `entity_not_found` in demo mode: verify the entity id mapping in `DemoDashboard.tsx` matches those in `mockEntities.ts`
- If type errors reference `@hakit/core` while in demo mode: stop and restart dev server so the alias is applied from a clean process
- If adding new mocks, ensure they produce a valid `HassEntities` fragment (object keyed by `entity_id`)

Run tests:

```bash
bun test
```

Build:

```bash
bun run build
```

## Shared Components

Adapted lightweight primitives (in `src/components/shared`) inspired by `ha-component-kit` (MIT) and rewritten for shadcn + Tailwind:

- `Alert`: contextual status banner (info | warning | error | success) with glass backdrop
- `AutoHeight`: animated collapse/expand container using height transition + rAF
- `ControlToggle`: accessible switch (vertical/horizontal, reversed, custom thickness & color)
- `ControlDial`: spring-smoothed circular value dial with snapping, haptics, tick marks, accessibility live announcements

Example:

```tsx
import { Alert, ControlToggle, AutoHeight } from '@/components/shared'

<Alert variant="warning" title="Pending" description="Alarm arming sequence" />
<ControlToggle checked={on} onChange={setOn} vertical thickness={120} />
<AutoHeight isOpen={open}><div>Content</div></AutoHeight>
<ControlDial value={brightness} onCommit={setBrightness} step={5} tickStep={10} haptics />
```

`AuroraAlarmCard` now renders an `Alert` for pending / triggered states.

### ControlDial Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `number` (0-100) | Current percentage value. |
| `onChange` | `(v:number)=>void` | Fired continuously while dragging. |
| `onCommit` | `(v:number)=>void` | Fired on drag end / keyboard commit. |
| `size` | `number` | Diameter in px (default 140). |
| `thickness` | `number` | Stroke thickness (default 10). |
| `springStrength` | `number` (0..1) | Lower = slower interpolation when external value changes. |
| `displayFormatter` | `(v:number)=>string` | Custom center text formatting. |
| `step` | `number` | Snap interval (percent); default 1. |
| `snap` | `boolean` | Enable snap behavior (default true). |
| `onSnap` | `(v:number)=>void` | Called when snapped bucket changes. |
| `haptics` | `boolean` | Vibrate (best-effort) on snap boundary. |
| `tickStep` | `number` | Interval for radial tick marks (percent). |
| `tickColor` | `string` | Tick stroke color. |
| `tickSize` | `number` | Tick length in px. |
| `tickMinorStep` | `number` | Interval for secondary ticks (ignored if overlaps majors). |
| `tickMinorSize` | `number` | Secondary tick length. |
| `tickMinorColor` | `string` | Secondary tick color. |
| `highlightActiveTicks` | `boolean` | Bold / higher opacity for progressed major ticks (default true). |
| `inertia` | `boolean` | Enable fling inertia on pointer release (default true). |
| `inertiaThreshold` | `number` | Minimum velocity (percent/sec) to start inertia (default 120). |
| `inertiaFriction` | `number` | Per-frame velocity retention 0..1 (default 0.92). |
| `inertiaMaxDuration` | `number` | Hard cap on inertia ms (default 1200). |
| `onInertiaStart` | `()=>void` | Called when inertia begins. |
| `onInertiaEnd` | `()=>void` | Called when inertia ends or is interrupted. |
| `inertiaMode` | `'reflect' \| 'clamp' \| 'overshoot'` | Behavior at bounds (default reflect). |
| `overshootLimit` | `number` | Max percent beyond bounds in overshoot mode (default 8). |
| `edgeGlow` | `boolean` | Enable edge pulse on hitting min/max (default true). |
| `edgeGlowColor` | `string` | Stroke color for edge glow. |
| `edgeGlowDuration` | `number` | Duration of edge glow ms (default 260). |
| `children` | `ReactNode` | Custom center content instead of built-in label/value. |

Accessibility: announces snapped values via an `aria-live` polite region, supports keyboard arrows (+Shift for larger delta), proper slider semantics.

## Appendix: Vite Template Notes

The original Vite React template notes are retained for reference.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) – Babel Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) – SWC Fast Refresh

### ESLint (Type-Aware) Example

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

### Optional React Lint Plugins

```js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```
