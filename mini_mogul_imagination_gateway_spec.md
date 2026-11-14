# Mini Mogul — Imagination Gateway

## Purpose
Build a dreamy, animated homepage that serves as the entry point to a playful entrepreneurship simulation for children, teenagers, and adults. Imagination comes first; learning about creation, resources, prices, customers, and management follows through interactive play.

## Visual reference direction
Based on the user's supplied screenshots: painterly blue skies, turquoise water, luminous clouds, sunlit foliage, fantastical floating islands, water reflections, magical particles, fluid visual motion. Interface references separately feature charming tactile game buttons and colorful, rounded shop-management panels. Do not reuse or redistribute reference images taken from Pinterest; create original artwork or use assets with clear licenses.

Not a fixed five-color palette. Use color by environment, lighting, depth, and narrative. Keep consistent visual grammar (camera, shapes, shadow softness, typography hierarchy, and interactions). Visually calm environment; higher saturation reserved for objects that draw attention.

## Product story
Home -> Imagine -> Create -> Play -> Review -> Repeat.
- **Home:** The World of Possibilities, a living sky-and-water scene with a tiny island and a glowing idea-seed/star.
- **Imagine:** Player enters a business idea, such as a magical bakery, dragon daycare, or pet-sitting service.
- **Create:** Player picks shop name, theme, product/service and first offering.
- **Play:** Player chooses price and quantity/capacity, runs a fictional business day, sees customers and surprise events.
- **Review:** Player sees understandable revenue, expenses, and results, with one short educational takeaway.

## Homepage desktop frame (Figma)
Frame: 1440 x 900.
- Full-bleed painterly environment across frame.
- Logo and tagline centered near top, y=70–165.
- Main floating island/world centered x=360–1080, y=235–690.
- Primary CTA centered y=720–790: **Start Imagining**.
- Secondary CTA below: **Continue** (disabled/hidden until saved progress exists).
- Sound and settings in top-right; accessible focus states.
- Original scene assets grouped as separate layers to support motion.

For a mobile frame, start from 390 x 844, reposition logo, island and CTA vertically; place settings in a top corner and avoid tiny controls.

## Scene layers and motion
1. Distant sky and clouds: gentle drift (20–45-second loop), subtle light changes.
2. Midground clouds/light: a few depth layers with restrained parallax (max 8–16 px).
3. Island/foliage: island floats about 5–8 px with 6–9-second easing loop; leaves sway subtly.
4. Water: seamless subtle shimmer/ripple (6–12-second loop); avoid rapid distortion or large video files.
5. Foreground particles: occasional slow rising stars/pollen, sparse and non-flickering.
6. Interface: title fade, tactile button hover/tap, accessible navigation.

Entrance storyboard:
- 0–0.8 s: background fades in.
- 0.6–1.6 s: island moves to resting position.
- 1.2–2.2 s: logo and idea-star arrive.
- 1.8–2.8 s: Start button appears.
- Then: low-intensity ambient loops.

Interaction storyboard:
- Start hover/focus: scale ~1.03, soft illumination, 0.15–0.25s.
- Start click: idea-star glides toward island, gentle expanding ripple, world slightly zooms, transition to Imagine screen within ~0.8–1.2s.
- Settings click: quiet floating panel appears with sound/music/motion controls.
- Continue: returns to saved local state (if present).

Honor prefers-reduced-motion: disable parallax, long idle animation and large zoom, retaining brief fades or instant transitions.

## Sound
Three mixable audio categories: original/licensed looping gentle music, low-volume water/wind ambience, and short UI SFX (water plop, chime, whoosh, coin reward). Start audio **only after user interaction**, with default muted or clear opt-in. Separate music and sound-effects toggles, plus master mute; persist preferences locally. No commercial soundtrack copying.

## Figma steps
1. File: Mini Mogul — Imagination Gateway.
2. Pages: Moodboard, Components, Homescreen, Prototype, Mobile.
3. Frame 1440x900 for Home. Create named layers Sky / DistantClouds / MidClouds / Water / Island / Particles / Logo / CTAs / Settings.
4. Duplicate into three frames: Home Idle, Start Trigger, Transition/Imagine.
5. Connect CTA in Prototype -> On Click -> Navigate To -> Smart Animate, 400–700ms as a simplified visual prototype.
6. Make separate variants for button idle, hover, pressed and disabled. Prototype settings overlay.
7. Make mobile 390x844 and test tap target sizes and legibility.

## Suggested software stack
Already established: React + TypeScript + Vite. Add Motion for React (`npm install motion`) for enter/exit and input feedback animations. Use CSS transforms and original layered SVG/PNG/WebP assets for modest parallax and particles. Use HTMLAudioElement for simple looped licensed audio and separate SFX; add Web Audio API only if necessary. Local state/localStorage for sound settings and page progress. Do not add Three.js/Spline until the base scene and core playable game work.

## Engineering priorities
M1: Build accessible, responsive static Home with original SVG/CSS fallback and a functioning Start button.
M2: Implement Home -> Imagine -> Create -> Play navigation; connect to any existing or stubbed playable game rather than landing on a dead end.
M3: Add the island/cloud/water ambient motion with reduced-motion fallback.
M4: Add opt-in music/ambience and sound effects only if legal, local assets are available; otherwise use silent placeholders without broken fetches.
M5: Polish after `npm run build` and manual Chrome testing.

## Acceptance criteria
- App loads at localhost and `npm run build` passes.
- Homepage is original, dreamy, visually coherent, responsive and readable.
- Start Imagining actually navigates to an idea-input screen; the idea can be submitted into a create step.
- Interactive controls have mouse/keyboard/touch support and focus indicators.
- Sound never surprises user on page load and can be muted.
- Reduced-motion settings work.
- No API keys, unlicensed Pinterest assets, or invented source data included.
- The app does not sacrifice a playable minimum loop to homepage animation polish.

## Paste-ready Claude Code instruction
You are the lead front-end engineer and motion designer for my existing Mini Mogul React + TypeScript + Vite project. Do not create a new repo. First inspect the current files and explain a concise plan, then implement in small, testable milestones.

Vision: Mini Mogul is a creative entrepreneurship game for kids, teens, and adults. The homepage is an imaginative gateway, not a generic SaaS landing page. Follow my attached Pinterest screenshots for *mood only*, not for copying copyrighted art. Reference: painterly luminous blue skies, rich turquoise reflective water, floating islands, gentle foliage, magical glow, soft clouds and fluid motion. The gameplay UI will eventually be a cozy tactile miniature-shop game. Do not lock the design to five or six colors: use an environmentally coherent, narrative palette, with consistent typography and interaction rules.

Implement a polished responsive homepage with:
- Layered original environment using CSS/SVG or original/licensed artwork (provide an attractive fallback if no art assets exist).
- Mini Mogul logo, tagline 'Imagine it. Build it. Grow it.', one clear CTA 'Start Imagining', and Continue if local progress exists.
- Small accessible Settings panel for music, SFX and reduced-motion.
- Gentle cloud drift, water shimmer/ripple, island bob, sparse glowing particles, restrained pointer parallax, graceful staged entrance and CTA transition.
- Use Motion for React (`motion/react`) where appropriate and prefer transform/opacity; avoid heavy canvas effects, aggressive bounce or flicker.
- At Start click, animate a glowing idea seed toward the island and transition into a working Imagine screen that asks 'What business would you like to build?' Include name and business idea input and a functioning next action. Link this to existing gameplay or provide a minimal Create step rather than a dead end.
- Make animation optional and honor `prefers-reduced-motion`.
- Audio must be opt-in/user-initiated, adjustable, and not autoplay audibly. Use only original/licensed files; if none exist, implement UI and graceful silent behavior without fetching broken assets. Do not copy commercial music.
- Responsive at 1440x900 and 390x844, strong keyboard focus states, accessible button sizes.
- Split into reusable components (e.g. HomeScene, AmbientLayers, StartButton, AudioSettings, ImagineScreen) without changing unrelated code unnecessarily.
- Preserve or improve any existing working gameplay.
- Build and verify with `npm run build`; fix compilation errors and report files changed. Do not deploy, publish, install paid tools, or modify remote repos without my approval.

Prioritize a complete working user flow over visual perfection. At completion describe how to run locally, what remains unfinished, and which visuals/audio require licensed assets.
