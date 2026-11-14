# Mini Mogul

An imaginative entrepreneurship game for children and adults. Imagine it. Build it. Grow it.

This repository contains the Imagination Gateway (animated homepage, idea entry, shop creation) and a playable opening day: set a price, make stock, open for business and read the day's report. See `mini_mogul_imagination_gateway_spec.md` for the full design.

## Run locally

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build
npm run preview  # serve the production build
npm test         # financial-maths tests (Node's built-in test runner)
```

## What is here

- `src/components/AmbientLayers.tsx` — sky, clouds, far isles, water and particles (shared by every screen)
- `src/components/Island.tsx` — the floating island artwork (original SVG)
- `src/components/HomeScene.tsx`, `StartButton.tsx` — homepage layout, idea-star and the main button
- `src/components/ImagineScreen.tsx`, `CreateScreen.tsx` — idea entry and shop setup
- `src/components/PlayScreen.tsx`, `DayReport.tsx`, `Dial.tsx` — shop dashboard and end-of-day report
- `src/components/ConfirmDialog.tsx` — close button and the leave-without-saving dialog
- `src/game/` — the business model, day simulation and saved game state (pure functions, whole cents)
- `tests/simulation.test.ts` — tests for demand, revenue, costs, profit, cash and inventory
- `src/components/AudioSettings.tsx` — sound toggle and settings panel
- `src/lib/` — saved settings/progress (localStorage), synthesised audio, hooks
- `src/styles/` — scene and interface styles

All artwork is original CSS/SVG. All sound is synthesised in the browser with the Web Audio API and is off until the player turns it on. There are no API keys, paid services or external requests.
