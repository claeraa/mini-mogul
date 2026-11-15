# Mini Mogul

An imaginative entrepreneurship game for children and adults. Imagine it. Build it. Grow it.

A player types any business idea, however fanciful, and Mini Mogul turns it into a small illustrated world with its own shop, customers and products. They then run the business a day at a time: set a price, decide how much to make, watch customers arrive, and read a report that explains revenue, costs, profit, cash and inventory in plain words.

## What it does

- **Imagination Gateway**: animated homepage, idea entry and shop creation with four art styles.
- **A world for every idea**: the building, setting, props, colours and customers are chosen from the idea. A built-in rule set does this with no AI; the optional AI Imagination Director does it with Claude.
- **A playable business day**: price, production and flyers, with customers, a shelf and a till in the world itself.
- **An honest day report**: profit, cash change and inventory are shown separately, with an explanation of why profit and cash differ.
- **A coach**: after each day, a short explanation, one thing to try and an optional challenge, from the AI or from the built-in coach.
- **My Worlds**: several saved worlds, each with its own progress.
- **Accessibility**: keyboard play, reduced-motion support, phone layout, sound off by default.

All money maths is done by a deterministic TypeScript engine in whole cents (`src/game/`). The AI never calculates, and cannot change a balance.

## Run locally

Needs Node.js 24 or newer.

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # all tests (Node's built-in test runner)
npm run lint
npm run build    # type-check and production build into dist/
npm start        # serve dist/ and the AI endpoint, as a host would (http://localhost:4173)
```

The game is fully playable with no API key and no network access.

## AI Imagination Director (optional)

With an API key, Claude (through the Anthropic API; Claude Haiku 5.5 by default) reads each business idea and directs the world: building, setting, props, colours, customers, product ideas and what the business teaches. After each day it coaches the player on what actually happened. Without a key, or whenever the AI is slow, down, refuses or returns something invalid, the built-in rules and coach take over and the game plays exactly as before.

### Switching it on

1. Create a key at <https://platform.claude.com/> (API keys). Set a low monthly spend limit there while you are at it.
2. Copy `.env.example` to `.env.local`. Git ignores `.env.local`; never put a key in any other file.
3. In `.env.local`, set `AI_DIRECTOR=on` and paste the key after `ANTHROPIC_API_KEY=`.
4. Restart `npm run dev` (or `npm start`). The server log says `[ai-director] on (anthropic, claude-haiku-5-5)`.

This makes paid API calls. `npm run ai:check` makes exactly two calls against a running server (one world, one coaching reply) and checks both with the game's own validators.

| Setting | Meaning |
| --- | --- |
| `AI_DIRECTOR` | Must be exactly `on`. Anything else keeps the AI off, even if a key is set. |
| `ANTHROPIC_API_KEY` | The key. Server-side only. |
| `AI_MODEL` | Optional. Defaults to `claude-haiku-5-5`. |
| `AI_DAILY_LIMIT` | Optional. Most AI calls per day across all players. Defaults to 300 (and 20 per minute). |

### How it is kept safe

- The key stays on the server (`server/`). The browser only ever calls this site's own `/api/ai/*`, and the key is not in the built site.
- The AI chooses only from artwork the renderer has, and every reply is validated on the server and again in the browser (`src/ai/schema.ts`).
- The AI never does maths. Coaching is given the financial engine's figures, may not mention any other number, and cannot change the game state. The server re-simulates the day and refuses to discuss one the engine could not have produced.
- Only the idea, the first product and the day's numbers are sent. The player's name is not.
- Server logs record the kind of failure only, never the player's words or the key.

## Deploying

The game needs a host that runs Node, because the AI endpoint is server code. **Uploading `dist/` to a static host (GitHub Pages, S3, Netlify static) gives a working game with the built-in rules only; the AI Director will be off.**

`server/serve.ts` is one small Node process, with no extra dependencies, that serves `dist/` and `/api/ai/*` together. Any Node host can run it:

- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start`
- Health check: `/healthz`
- Node 24+; the host supplies `PORT`.
- Environment variables, set in the host's dashboard and nowhere else: `AI_DIRECTOR=on`, `ANTHROPIC_API_KEY`, optionally `AI_MODEL` and `AI_DAILY_LIMIT`.

`render.yaml` describes exactly this for [Render](https://render.com/): create a Blueprint from the repository, and paste the key when the dashboard asks for `ANTHROPIC_API_KEY`. On Render's free plan the service sleeps when idle and takes up to a minute to wake, so open the site shortly before a demo.

Once the site is public, anyone who finds it can trigger AI calls. The per-minute and per-day caps bound the cost; a spend limit on the API key is the backstop.

## Limitations

- **Every business plays as make-and-sell.** A service idea (pet sitting, tutoring) gets a fitting world but still sets a price and makes stock; bookings, staff and appointments are not modelled.
- **One business model.** One product, one price, one optional marketing action, a small set of daily events.
- **The AI picks from existing artwork.** It cannot draw new buildings, props or characters; an unusual idea is carried by its name, customers and speech bubbles.
- **Saves are local.** Worlds live in one browser on one device, with no accounts or sync. Two tabs open at once overwrite each other.
- **Rate limits are in memory.** They reset when the server restarts and are shared by all players, not per player.
- **English only.**

## My Worlds and saved progress

Players can keep several worlds. Each has its own id, shop, style, AI-imagined world, game days, cash and history; nothing is shared between them. Worlds are stored in the browser's localStorage under `mini-mogul:worlds`, so they belong to one browser on one device and are not synced or backed up online.

A save from before My Worlds existed (`mini-mogul:progress`, `mini-mogul:game`, `mini-mogul:ai-worlds`) is copied into the new store the first time the game loads. The old keys are left untouched and a copy is kept under `mini-mogul:legacy-backup`.

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
- `src/ai/` — what the AI may say (`schema.ts`) and how a checked reply becomes a world (`world.ts`)
- `server/` — the `/api/ai` endpoint: prompts and checks (`director.ts`), the Anthropic provider (`provider.ts`), request handling shared by every server (`http.ts`), the Vite middleware (`vitePlugin.ts`), the production server (`serve.ts`) and the live check (`check.ts`)
- `render.yaml` — hosting description for Render
- `src/lib/ai.ts` — the browser's client for that endpoint, with caching and fallback
- `src/worlds/store.ts` — My Worlds: the multi-world save, its checks and the migration from the old single save
- `src/components/WorldsScreen.tsx` — the My Worlds screen
- `src/game/coach.ts` — the day's facts for the coach, and the built-in coach
- `src/game/report.ts` — splits a day into profit, cash change and inventory for the report
- `tests/` — tests for demand, revenue, costs, profit, cash, inventory, the report, the blueprints, the AI checks and fallbacks, and My Worlds
- `src/components/AudioSettings.tsx` — sound toggle and settings panel
- `src/lib/` — saved settings/progress (localStorage), synthesised audio, hooks
- `src/styles/` — scene and interface styles

## Dependencies and credits

- Runtime: React 19, Motion (animation), the Anthropic TypeScript SDK and Zod (AI endpoint only).
- Build and checks: Vite, TypeScript, oxlint, Node's built-in test runner.
- Fonts: Fredoka, Nunito and Gochi Hand, all under the SIL Open Font License, bundled locally through Fontsource.
- All artwork is original CSS/SVG. All sound is synthesised in the browser with the Web Audio API and is off until the player turns it on.
- Unless the AI Director is switched on there are no API keys, paid services or external requests.

## AI assistance

Mini Mogul was built for HackPrinceton with substantial help from AI:

- **In the game:** the optional AI Imagination Director and coach use Claude (Anthropic API), within the limits described above.
- **In development:** the concept, design direction, requirements and review are the team's. Much of the code, SVG artwork and tests were written with Claude Code, Anthropic's AI coding assistant, working to the team's specifications and tested by the team.
