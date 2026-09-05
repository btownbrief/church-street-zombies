# Gameplay verification

Run `npm test` for navigation, hitscan, skate physics, horde balance, and YEET simulation. Run `npm run build` for the production bundle.

Use the development preview at `http://localhost:5186/?qa=1` for the visible integration panel. Test scores use a separate local storage key. Scripted fixtures prove individual mechanics and transitions; they do not substitute for playing the full ten-wave run.

Before the final handoff, exercise desktop and touch controls, all enemy behaviors, explosives and barricades, YEET collisions, skating transitions and course features, runner portals, upgrades, death/restart and saved scores in the browser. Inspect mobile portrait and landscape layouts. Record actual results and limitations here as each pass completes.

The original approved environment files must continue to match `environment-manifest.json`. Physical phone performance and native pointer capture require separate verification and must not be inferred from emulated touch or synthetic browser gestures.

Status: integration work is ongoing; earlier browser checks cover the initial shooter/skate version only.

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

Outstanding: complete crossover modes/art/course, final human-style play and timing pass, physical phone performance, native physical pointer capture, and final delivery audit. Do not present this interim checkpoint as the completed game.
- Follow-up final-wave bot using nine obtainable upgrades, range-based pistol/shotgun switching, backwards movement, grenades and close-range YEET: survived all 105 enemies, 51 headshots, 72/150 health remaining, 25.3 simulated seconds. Perfect aiming and accelerated steps make this a coupled-mechanics check, not a claim of human balance or ten-minute pacing.
