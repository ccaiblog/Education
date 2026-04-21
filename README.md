# STEM Sprint

STEM Sprint is a polished 2D side-scrolling runner built with **Phaser 3 + Vite**. It blends fast arcade gameplay and lightweight learning loops without turning into a quiz app.

## Why this stack
- **Phaser 3**: robust 2D game framework with battle-tested rendering, physics, particles, tweens, and scene architecture.
- **Vite**: fast local iteration and simple deployable static build.
- **Data-driven content**: question bank in JSON for easy expansion.

## Features implemented
- Endless runner platformer feel with acceleration, jump/double-jump, fast-drop.
- Varied obstacle timing and multiple obstacle types.
- Collectibles (coins + energy), combo/streak system, and score scaling.
- Power-ups: shield, magnet, temporary speed boost.
- Difficulty ramps over time.
- Layered motion background, glow-style UI, particles, shake, and hit feedback.
- Warm-up flow (10 STEM questions) with start-of-run advantages.
- Checkpoint question sets every 2–3 minutes with **safe trigger logic**:
  - delayed if airborne
  - delayed if obstacle is too close ahead
- Rewards and gentle penalties from checkpoints.
- Leaderboard simulation with rank display and pass-notification hook.

## Run locally
```bash
npm install
npm run dev
```
Open the local URL shown by Vite.

## Build
```bash
npm run build
npm run preview
```

## Project structure
```text
src/
  data/questions.json          # STEM question bank (math + science)
  scenes/BootScene.js          # preloads data
  scenes/MenuScene.js          # title + warm-up launch
  scenes/GameScene.js          # gameplay loop, systems, effects
  systems/QuestionManager.js   # draw warm-up/checkpoint question sets
  ui/quizOverlay.js            # HTML overlays for warm-up/checkpoints/board
  gameConfig.js                # global constants and tuning
  main.js                      # Phaser game config and scene registration
  styles.css                   # modern polished UI styling
```

## Swapping assets
Current prototype generates textures procedurally in `GameScene.createTextures()`.

To use production art/audio:
1. Add files under `public/assets/` (recommended).
2. Load in `BootScene.preload()` with `this.load.image/audio`.
3. Replace generated texture keys in `GameScene` with loaded keys.
4. Keep hitboxes tuned by updating body size/offset for each sprite.

## Balancing knobs
- Player physics and speed: `src/gameConfig.js`
- Spawn rates and difficulty: `spawnTimers()`, `currentSpeed()` in `GameScene`
- Checkpoint cadence and safety distance: `nextCheckpointAt`, `isSafeForCheckpoint()` in `GameScene`
- Reward/penalty values: `pauseAndAskCheckpoint()` and warm-up handoff in `MenuScene`

## Future improvements
- Online leaderboard service + authenticated rivals.
- Ghost replay markers and asynchronous race mode.
- Art pass with skeletal player animation and authored background layers.
- Audio mixing + dynamic music intensity by speed/combo.
- Accessibility options (color-blind palettes, reduced motion).
