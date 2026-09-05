# Church Street: Last Light

**First playable version:** a local crossover of zombie survival, Church Street Skate, Church St Runners, and Street Yeet. The accepted direction and source references are in `docs/CROSSOVER-PLAN.md`.

A playable first-person zombie survival game with a skateboarding escape route, set in Burlington's Church Street Marketplace. Ten waves, two guns, upgrades, pickups, YEET attacks, explosives, barricades, five compact skate lines, two halfpipes, and optional runner portals. Desktop and touch controls. No accounts, servers, downloads from CDNs, or online leaderboard.

## Play on this Mac

```sh
cd /Users/stephendavis/Projects/church-street-zombies
npm install
npm run dev
```

Open **http://localhost:5186/** in Chrome, Safari, or another modern WebGL2 browser. Dependencies are already installed on this Mac. During development, the local preview runs on port 5186.

For a production build:

```sh
npm run build
npm run preview
```

Only run one server on port 5186 at a time. Press Control-C in the server terminal to stop it. `dist/` can be served by any ordinary static host. This version has not been publicly deployed.

## Play on your phone

1. Put your phone on the same Wi-Fi as this Mac.
2. Leave the local game server running on the Mac.
3. Open **http://192.168.0.178:5186/** in your phone's browser.
4. Turn the phone sideways for the widest view. Portrait also works.

That is the Mac's Wi-Fi address at handoff; it can change. The Vite terminal prints the current Network address on startup. Touch devices show their controls automatically; **Controls & settings → Show touch controls** enables them manually. All assets are served locally. A physical iPhone/Android performance test has not been done.

## Controls

| Action | Desktop | Phone |
|---|---|---|
| Walk | WASD / arrows | Left thumb stick |
| Look | Mouse | Drag right side |
| Fire | Hold left mouse | Hold FIRE; drag that button to aim too |
| Sprint | Shift + forward | Push stick fully forward |
| Reload | R | RELOAD |
| YEET zombie / red barrel | Hold/release Q | Hold/release YEET; drag to aim |
| Grenade | G | GRENADE |
| Place wall / barrel | V / T | WALL / BARREL |
| Pistol / shotgun | 1 / 2 | WEAPON |
| Skate / hop off | B | SKATE / HOP OFF at top centre |
| Pause | Esc / P | Pause button |
| Sound | M | SOUND button |

While skating, the camera moves behind the rider so you can see the board and tricks. W pushes, S brakes (then slowly reverses), and A/D carves; the left stick does the same. Hold/release Space or OLLIE to charge/pop. **J / K / L** performs kickflip / heelflip / shove-it; mobile **FLIP** and **SHOVE** auto-pop. Aim an ollie at a silver rail and descend onto it to grind automatically. Five larger two-way banks launch you when crossed with speed. Two curved halfpipes let you carry momentum up a transition, pop above the coping, and return fakie. Air spins preserve your direction of travel; finish the rotation before landing to avoid bailing. The new Blender-built rider has a sideways stance, fitted clothing, animated pushing/crouching and no hat. Hop off after landing to use your gun. Shooting while riding is intentionally excluded from this first version.

If mouse capture is unsupported, the game falls back to dragging to aim while holding the mouse button to fire. The Codex in-app browser used this fallback; Chrome's native mouse capture was not assumed from that result.

## The run

- Start near Big Joe and the meeting house with a 12-round pistol and 72 reserve rounds. Heads take extra damage; orange jackets identify sprinters from the first wave; green spitters arrive in wave 2 and armored brutes in wave 3.
- Waves grow from 24 to 105 zombies, arriving in overlapping groups with at most 52 alive at once. Enemies spawn 20+ metres away in reachable space, with a 1.05-second emergence warning before movement or damage.
- Furniture, statues, and building frontage bounds shape shared collision and a grid flow field. Zombies route around the added skate obstacles; skaters ride the new banks and rails. There are no enterable interiors or cross-street detours in this version.
- Hold/release YEET to fling a nearby zombie or red explosive barrel into others. The charge pulses; aim changes the arc. Brutes stagger instead of flying. Shooting red barrels starts chain reactions. G throws a grenade; V/T place breakable walls/barrels. Equipment replenishes between waves.
- Clear a wave to heal 25, receive ammunition, and choose one permanent-for-the-run upgrade. The shotgun is offered starting after wave 1.
- After choosing, take an 18-second breather. Follow green supply beacons toward Cherry, Bank, College, and City Hall. Each new station grants a full heal, extra ammunition, and 300 points. Press E away from the portal or tap the objective to start the next wave early.
- Land tricks for score and three pistol rounds. Ammo drops every third kill; health drops and emergency ammunition prevent a missed supply case from making the run impossible.
- Survive wave 10 to reach the victory screen. Personal best is saved in this browser's local storage. Restart starts a fresh run without deleting that best.

The ten-minute pacing is a design target, not a measured average from human playtests. Breaks pause while choosing upgrades. Movement pace, missed shots, exploration, and tricks change run length.

## Church St Runners portals

After choosing an upgrade, approach the purple portal and press **E** or tap **ENTER RUNNER PORTAL**. The survival session freezes while you run. The three-lane challenge uses the original runner's movement tuning: A/D or left/right swipes change lanes, W/Space or swipe up jumps, S or swipe down slides and fast-falls. Speed increases, two hits end the bonus run, coins earn supplies, magnets attract coins for seven seconds, and creemees grant 4.5 seconds of flight.

Dodge dog walkers, shoppers, distracted pedestrians, deliveries, café furniture, bikes, zombies, rails, ramps, and low banners. Every obstacle row leaves a clear lane. Run south-to-north through the updated Church Street environment; the far portal starts the next lap. **BANK & RETURN** lets you leave at any time. A failed runner challenge also returns safely to survival. Earned health/ammunition and score are capped, with one entry per wave break. Runner best is saved separately.

This adapts the core mechanics from `btownbrief/church-street-runner` at `d5ad7e3`, rather than importing its older street or every secondary feature (such as its dog-chase sequence). Runner pedestrians are stationary obstacles in this first version.

## Environment preservation

The approved environment was copied from current JavaScript/JSON source in `/Users/stephendavis/Projects/church-street-world`, at commit `af8f40284ee4aee69d711ad14f71b72db8fd4c4a`. Its building, statue, prop, terrain, facade, and world modules remain byte-identical; see `docs/environment-manifest.json`. The old exported GLB was not used. The original project was not edited.

`docs/ENVIRONMENT-README.md` preserves the original README and its fidelity limits. `docs/original-exploration-controls.js` records the original movement/mouse/terrain logic adapted into this game. This is the approved reconstruction as supplied, not a claim of survey-perfect Burlington.

The original skate reference is [btownbrief/church-street-skate](https://github.com/btownbrief/church-street-skate), inspected at local commit `9778f51`. Its README, architecture, physics, input, tuning, and skatepark modules informed charged pops, state transitions, and keyboard mappings. Its Three.js world and large skatepark layout were not imported. This game uses its own compact PlayCanvas skate implementation and explicitly fictional, temporary pieces alongside the approved scenery.

## Project map

- `src/main.js`: scene setup, run state, weapons, enemy waves, upgrades, HUD, integration.
- `src/game/input.js`: keyboard, pointer lock fallback, multi-pointer thumb controls.
- `src/game/navigation.js`: shared collision, flow-field routing and hitscan math.
- `src/game/encounters.js`, `combat-kit.js`, `yeet.js`: waves, enemy tuning, defenses, explosives and throws.
- `src/game/models.js`, `audio.js`: procedural characters, weapons, pickups, synthesized sound.
- `src/game/skate.js`, `skate-course.js`, `skate-course-data.js`: skating physics, shared course geometry/collision and rider animation.
- `src/game/runner.js`, `runner-scene.js`: runner simulation, obstacles and portal scene.
- `scripts/build-rider.py`, `assets/source/skater.blend`: reproducible Blender rider source; the runtime GLB is in `public/assets/`.
- `src/world.js` and original source modules: preserved approved environment.
- `tests/`: 33 tests covering navigation, hitscan, combat, skating, runner controls, obstacle fairness and rewards.
- `src/game/qa.js`: development-only browser test panel, available with `?qa=1`, removed from production builds. QA best scores use a separate storage key.

## Verification

Run `npm test` and `npm run build`. See `docs/TESTING.md` for browser checks and limitations. Tests intentionally include meaningful navigation and skate behavior, not only successful compilation.

The build and 33 automated tests pass. Real-browser fixtures exercised combat, skating, portals and mobile gestures. A full human ten-minute playtest, physical phone performance and native pointer capture remain unverified. A continuous aiming bot survived five waves before dying in wave six; a separate equipped final-wave test survived all 105 enemies. These are diagnostic results, not proof of human difficulty or AAA production quality. The final live browser recheck was unavailable because the Mac was locked.
