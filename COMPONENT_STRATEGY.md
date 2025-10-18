# Component Implementation Strategy (Hybrid)

We apply a hybrid approach mixing shadcn/Radix primitives for complex interactive widgets and custom lightweight components for trivial or highly specialized interactions.

## Use shadcn/Radix for

- Layered / portal interactions: Dialog, Popover, Tooltip, Select.
- Complex keyboard + a11y semantics: Tabs, ToggleGroup, Slider, Combobox-like selects.
- Focus management & collision handling.

## Use custom lightweight implementations for

- Simple toggles (Switch), number steppers, small counters.
- Visual one-off controls (special sliders, status badges) when logic < ~80 LOC.
- Gesture-driven experimental controls where Radix constraints hinder UX.

## Current Mapping

| Domain | Component | Strategy | Notes |
|--------|-----------|----------|-------|
| Input  | ControlNumber | Custom | Minimal logic, numeric stepper. |
| Toggle | ControlSwitch | Custom | Simpler than Radix switch; keep accessible. |
| Select | ControlSelect | Radix | Typeahead, a11y, portal. |
| Slider | ControlSlider | Radix | For styling + a11y. |
| Segmented | ControlSegmented (planned) | Radix ToggleGroup | Multi-option exclusive selection. |
| Future Combobox | ControlCombobox (planned) | Radix + Command | Searchable entity list. |
| Combobox | ControlCombobox | Radix + Command | Implemented searchable selection. |
| Multi-Select | ControlMultiSelect | Radix + Command (custom multi) | Tag/chip multi selection. |
| Color Picker | ControlColorPicker | Popover + Slider (hybrid) | Lightweight HSL + alpha sliders. |
| Time Range | ControlTimeRange | Popover + native time inputs | Start/end with presets. |
| Date Picker | ControlDatePicker | Popover + Calendar (react-day-picker) | Single date selection. |
| Date Range | ControlDateRangePicker | Popover + Calendar (react-day-picker range) | Two month range selection. |
| Light | LightControlPanel | Capability-driven composite | Glassmorphic panel (brightness/color/temp/effects). |

## Capability-Driven Panels

Instead of porting monolithic entity domain components 1:1, we derive a capability object from entity attributes (e.g. light supports brightness, color, temperature, effects). Panels render only the sections each entity can use. This keeps UI lean and avoids dead controls.

`getLightCapabilities(entity)` returns booleans + ranges used by `LightControlPanel` to conditionally render sections. Future domains (climate, media_player, cover) will follow the same pattern: a `getXCapabilities()` function + a composable panel.

## Upgrade Path

All controls sit behind `src/components/shared/*` so we can swap implementation without consumer changes.

## Guidelines

1. Default to Radix if unsure and complexity > trivial.
2. Avoid premature abstraction; elevate to shared only when reused ≥2 places.
3. Keep prop surface minimal; prefer composition.
4. Document deviations from default shadcn styles inline with comments.

---

Generated automatically; adjust as components evolve.
