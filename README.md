# Mini Mogul

An imaginative entrepreneurship game for children and adults. Imagine it. Build it. Grow it.

This repository currently contains the Imagination Gateway: the animated homepage, the idea entry screen, and a minimal shop-creation step. See `mini_mogul_imagination_gateway_spec.md` for the full design.

## Run locally

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build
npm run preview  # serve the production build
```

## What is here

- `src/components/AmbientLayers.tsx` — sky, clouds, far isles, water and particles (shared by every screen)
- `src/components/Island.tsx` — the floating island artwork (original SVG)
- `src/components/HomeScene.tsx`, `StartButton.tsx` — homepage layout, idea-star and the main button
- `src/components/ImagineScreen.tsx`, `CreateScreen.tsx` — idea entry and shop setup
- `src/components/AudioSettings.tsx` — sound toggle and settings panel
- `src/lib/` — saved settings/progress (localStorage), synthesised audio, hooks
- `src/styles/` — scene and interface styles

All artwork is original CSS/SVG. All sound is synthesised in the browser with the Web Audio API and is off until the player turns it on. There are no API keys, paid services or external requests.
