# Gameplay verification

Run `npm test` for navigation, hitscan, skate physics, horde balance, and YEET simulation. Run `npm run build` for the production bundle.

Use the development preview at `http://localhost:5186/?qa=1` for the visible integration panel. Test scores use a separate local storage key. Scripted fixtures prove individual mechanics and transitions; they do not substitute for playing the full ten-wave run.

Before the final handoff, exercise desktop and touch controls, all enemy behaviors, explosives and barricades, YEET collisions, skating transitions and course features, runner portals, upgrades, death/restart and saved scores in the browser. Inspect mobile portrait and landscape layouts. Record actual results and limitations here as each pass completes.

The original approved environment files must continue to match `environment-manifest.json`. Physical phone performance and native pointer capture require separate verification and must not be inferred from emulated touch or synthetic browser gestures.

Status: first playable handoff. Completed checks and remaining verification limits are recorded below.

## September 5 — combat and YEET pass

- `npm test`: 18 passing cases, including escalating horde/special introductions, dynamic barricade routing, explosion falloff, timed YEET charge, target visibility/range, swept domino collision, cancellation, brute resistance and scenery impact.
- `npm run build`: production build passed. Existing PlayCanvas worker externalization and large-bundle warnings remain.
- In-app browser: 14 real-engine equipment/YEET checks passed (placement, collision/removal, shooting a barrel chain, grenade stock/fuse, charged flight/domino kills, brute stagger, spitter windup/projectile). These use controlled fixtures.
- In-app browser: 29 general integration checks passed for movement/sprint, pause, ammunition, fair spawn distance, skate trick/hop-off, upgrades, shotgun, landmark supply, headshot, death, saved best, restart and all ten wave transitions. Wave-end fixtures do not simulate full combat.
- An actual click on the touch YEET button launched one zombie, caused two domino hits, killed three test zombies, awarded 450 points and preserved first-person camera/player position. The practice fixture held targets still for the input check.
- 390×844 and 844×390 layouts inspected visually. Fixed equipment/vitals overlap in portrait and score/ammo overlap in landscape. Console error list was empty on the inspected test page.
- First-wave stationary aiming bot: 24 kills / 24 headshots, survived in 11.6 simulated seconds. This uses perfect aim and accelerated stepping, not a human completion-time measurement.
- Final-wave stationary shotgun bot with nine obtainable upgrades: 45 kills / 24 headshots, died after 27.9 simulated seconds with 52 enemies alive. This is a stress/balance observation; it does not establish that final-wave difficulty is finished. A mixed-weapon moving test is being evaluated next.
- Source preservation rechecked: all 16 manifest files still match both their recorded hashes and the original world source. Original world Git status was clean at the recorded source commit.

This was an interim combat checkpoint; the completed crossover checks follow.
- Follow-up final-wave bot using nine obtainable upgrades, range-based pistol/shotgun switching, backwards movement, grenades and close-range YEET: survived all 105 enemies, 51 headshots, 72/150 health remaining, 25.3 simulated seconds. Perfect aiming and accelerated steps make this a coupled-mechanics check, not a claim of human balance or ten-minute pacing.

## Final crossover pass

- `npm test`: **33 passing**, including six additional skate-course tests and nine runner tests. Tests cover momentum-preserving air spins, halfpipe return, bank transfers, vertical-side collision, grind pop scoring, fakie landing, three lanes, jump/slide clearance, fast-fall, damage grace period, powers, lap continuity, avoidable rows and capped rewards.
- Browser: **17 equipment/YEET checks**, **6 rider/course checks**, **29 general integration checks**, and **13 runner lifecycle checks** passed. The rider check confirms all six morph poses loaded from the actual GLB, and the course has fewer than 20 render components. These are controlled real-engine fixtures.
- Browser visual checks: smooth sideways rider, no hat, push/crouch/run/slide poses; larger banks and curved halfpipes. Fixed pavement showing through course surfaces by sampling the full terrain grid.
- Actual phone-size pointer gestures: runner lane changes, jump and slide; bank/return produced supplies and restored the survival session. The safe input fixture removes hazards, so this is not a claim of manually dodging a full runner course. Portrait 390×844 and landscape 844×390 layouts inspected.
- Full campaign diagnostic: normal wave rewards and obtainable upgrades, perfect aim, range-based weapons, backwards movement, grenades and YEET. Survived waves 1–5; died in wave 6 after 256 kills and 227.9 simulated seconds. The bot does not seek supplies, skate away or place defenses. Difficulty was not reduced simply to make this test pass.
- Final code review fixed an undefined zombie animation seed on thrown barrels (now a finite default), guarded weapon actions during runner mode, and made runner loss use the damage cue. These last small changes passed the build and unit suite; a fresh browser pass could not run because the Mac was locked.

### Limits

No full human ten-minute timing/difficulty playtest, physical iPhone/Android performance test, or physical native mouse-capture check was completed. Desktop drag-look fallback and emulated mobile inputs were verified. An earlier transient HMR error occurred while the HTML and main module were being edited in sequence; subsequent page loads and integration checks passed. The locked Mac prevented a fresh final console check. The production build is tested separately from development fixtures; QA controls are excluded from it.

Final delivery audit passed: all 16 approved environment files match the manifest hashes and current original source. Git status is clean in the original world, skate, runner and Street Yeet projects. The local preview returns HTTP 200; production excludes the development QA panel. Build passed with PlayCanvas worker externalization and large-chunk warnings. This release is a local arcade first version, not a claim of AAA asset fidelity or production-scale performance testing.

## Publishing pass — September 5

34 tests pass, including actual PlayCanvas asset URL resolution at the GitHub Pages subfolder. Vite's production base is `/church-street-zombies/`; the registry prefix relocates runtime assets while preserving all approved source files byte-for-byte. A local production browser check loaded the street and rider, started wave one, and switched to skating with no reported console errors. The development root preview remains available. GitHub Pages game deployment 33969534705 and Arcade deployment 33969590610 succeeded. Live HTTPS gameplay loaded and switched from first person to skating; the street texture and rider GLB matched their local bytes. A 390×844 live page with touch controls loaded without reported game console errors. Arcade showed the new first Action & Arcade card; network search returned Last Light; the Hub dynamically appended it to the Arcade shelf, filtered it by name, and its link opened the public game. All 16 approved environment files remain unchanged. Physical-device and human balance limitations above still apply.

Published game: https://play.btownbrief.com/church-street-zombies/
Source: https://github.com/btownbrief/church-street-zombies
Catalog commit: btownbrief/btownbrief.github.io@694cff5. No Hub source edit is necessary: its documented catalog merge supplies discovery. The Arcade now skips leaderboard requests for games explicitly marked `leaderboard: false`.

## September 5 — feel pass (skate, shooter, YEET, touch HUD)

- `npm test`: **37 passing**. New cases cover impulse pushes reaching the street cap, speed-scaled pop, backflip start/score/bail timing, tap-strength YEET, and halfpipe air above the coping with spin room.
- `npm run build`: passes.
- Headless PlayCanvas checks via the `?qa=1` panel: skate course (6), horde equipment and YEET (17), general integration incl. all ten waves (29) all PASS with no console errors.
- Phone screenshots (iPhone 13 landscape 750×342 and portrait 390×664) inspected after the touch HUD rebuild: top status band, clear centre, equipment as three round buttons, weapon cluster bottom-right, no overlaps. Halfpipe end wall verified solid from the street.
- Real Chrome on the Mac: skating at 50 km/h with the ported follow camera, no console errors.
- Not verified: a physical phone in hand (sticky aim, swipe gain, sprint threshold are tuned by reasoning and emulation, not thumbs), and human balance of the new YEET distance bonus.
