# Mini Mogul

An imaginative entrepreneurship game for children and adults. Imagine it. Build it. Grow it.

This repository contains the Imagination Gateway (animated homepage, idea entry, shop creation), a personalised world built from each idea, and a playable opening day: set a price, make stock, watch customers arrive and read the day's report. See `mini_mogul_imagination_gateway_spec.md` for the full design.

## Run locally

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build
npm run preview  # serve the production build
npm test         # maths, report and world-blueprint tests (Node's built-in test runner)
```

## What is here

- `src/components/AmbientLayers.tsx` — sky, clouds, far isles, water and particles (shared by every screen)
- `src/components/Island.tsx` — the floating island artwork (original SVG)
- `src/components/HomeScene.tsx`, `StartButton.tsx` — homepage layout, idea-star and the main button
- `src/components/ImagineScreen.tsx`, `CreateScreen.tsx` — idea entry and shop setup
- `src/world/blueprint.ts` — `generateWorldBlueprint()`: keyword rules that turn an idea, first product and style into a themed world (no AI)
- `src/components/WorldScene.tsx`, `WorldParts.tsx` — the scene, buildings, props and product icons drawn from a blueprint
- `src/components/PlayScreen.tsx`, `ShopStreet.tsx`, `DayReport.tsx`, `Dial.tsx` — the shop in its world, customers and shelf, and the end-of-day report
- `src/components/ConfirmDialog.tsx` — close button and the leave-without-saving dialog
- `src/game/` — the business model, day simulation and saved game state (pure functions, whole cents)
- `src/game/report.ts` — splits a day into profit, cash change and inventory for the report
- `tests/` — tests for demand, revenue, costs, profit, cash, inventory, the report and the blueprints
- `src/components/AudioSettings.tsx` — sound toggle and settings panel
- `src/lib/` — saved settings/progress (localStorage), synthesised audio, hooks
- `src/styles/` — scene and interface styles

All artwork is original CSS/SVG. All sound is synthesised in the browser with the Web Audio API and is off until the player turns it on. There are no API keys, paid services or external requests.
