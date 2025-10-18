# Charts & Sparklines

Aurora uses Apache ECharts (via `echarts-for-react`) for performant, themeable visualizations that fit the glassmorphic design.

## Components

| Component | Purpose | Notes |
|-----------|---------|-------|
| `AuroraEChart` | Full entity history line chart | Modular registration for minimal bundle. Uses time axis + LTTB sampling. |
| `EnergyChart` | Example consumption line area card | To be refactored to reuse shared wrapper patterns. |
| `Sparkline` | Tiny inline trend (e.g., sensor value) | Hidden axes, gradient fill, lightweight config. |

## Sparkline Usage

```tsx
import { Sparkline } from '@/components/charts/Sparkline'

const points = Array.from({ length: 48 }, (_, i) => ({
  t: i, // or timestamp
  v: Math.sin(i / 5) * 10 + 42,
}))

<Sparkline data={points} height={50} color="#7dd3fc" />
```

### Props
- `data`: `{ t: number|string; v: number }[]`
- `color`: line color (default blue)
- `gradientFrom` / `gradientTo`: area fill stops
- `smooth`: boolean (default true)
- `showTooltip`: enable axis hover (default true)
- `height`: container height px

## Theming Guidelines

- Keep backgrounds transparent; rely on the card glass layer.
- Use subtle dashed grid lines with low alpha (≈0.1) for minimal visual noise.
- Prefer `sampling: 'lttb'` on dense datasets to reduce overdraw and preserve shape.

## Performance Tips

| Technique | Benefit |
|-----------|---------|
| Modular imports (`echarts/core`) | Smaller bundles, tree-shaken features |
| Canvas renderer | Faster on most dashboards (default here) |
| Disable animation for live data | Avoid layout thrash on rapid updates |
| Progressive rendering (`progressive`, `progressiveThreshold`) | Smooth large series drawing |
| LTTB sampling | Preserves visual shape during downsampling |

## Next Steps (Planned)
- Shared `useEntityHistory(entityId, range)` hook with buffering + resampling.
- Reusable `RadialGauge` built on ECharts polar coordinates.
- Sparkline embedding inside `AuroraSensorCard` & forthcoming Energy composite.

## Migration Notes
`EnergyChart` currently uses the default React wrapper; consider updating it to match the modular pattern used in `AuroraEChart` for consistency and bundle efficiency.
