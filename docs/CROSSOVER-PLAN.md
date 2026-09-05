# Church Street crossover — accepted direction, September 5

Preserve the current-source PlayCanvas environment and all four original reference projects. All new mechanics and temporary course/equipment pieces belong in this separate project. Final scope is three playable modes with four influences.

## Combat + Street Yeet

First-person horde combat is the main run. Dense overlapping groups, quick pistol fire, early shotgun, sprinters, telegraphed ranged spitters, and armored brutes. Grenades, chain-exploding barrels and destructible player-placed barricades create crowd-clearing choices. Zombies must route around scenery and break a blocking defense rather than stall the wave.

Street Yeet reference: `/Users/stephendavis/btownbrief/street-yeet`, read README, AGENTS, js/player.js, js/main.js, js/items.js and physics structure. Its signature is a 5.4m target lock, a charge meter sweeping every .62 seconds, look-directed loft, and domino collisions. Adapt this into hold/release Q or a touch YEET button. Preserve the player's camera and continuous combat; reward damage, kills and dominoes rather than distance. Use an accurate shared launch/preview calculation. Heavy brutes resist launching. Cap active physical effects for phone performance. Clearly marked loose combat props may be thrown; approved statues and buildings remain preserved.

BOXHEAD references: developer Sean Cooper's [More Rooms](https://www.kongregate.com/en/games/seancooper/boxhead-more-rooms) and [The Zombie Wars](https://armorgames.com/play/1004/boxhead-the-zombie-wars?comments=direct). Apply dense cannon-fodder crowds, tougher specials, chained explosives and defenses. All visual assets are original to this project; no BOXHEAD art imported. Research used built-in web search; no Firecrawl credits used.

## Skating

Third-person free skating with charged ollies, flip/shove tricks, momentum, carving, grinding and readable landing feedback. Reference `/Users/stephendavis/btownbrief/church-street-skate`, current source at 9778f51: README, architecture, input, tuning, physics and skatepark. Adapt tight-street speeds and approach lengths instead of importing its large open courses. Improve the rider with a proper sideways stance, natural proportions/clothes and no distracting hat. Larger banks, quarter pipes, occasional halfpipes, connected rails with usable landings. Land tricks for ammunition and score; hop off to shoot.

## Portal runner

Reference `/Users/stephendavis/btownbrief/church-street-runner`, current source at d5ad7e3. Preserve three lanes spaced 2.1m, lane changes at 14m/s, jump/slide and fast-fall, increasing forward speed, two-hit allowance, coins, magnet (7 seconds), creemee flight (4.5 seconds) and Burlington obstacle personalities. Source normal speed begins at 11m/s, rises .42m/s each second, caps at 24m/s. Source jump velocity 8.6, gravity26, slide .62 seconds.

Optional portals open between waves. Pause/preserve the survival session while running. Run through the approved updated street, then portal into successive laps. Include zombies/skate hazards plus dog walkers, deliveries, café furniture, shoppers and distracted pedestrians. Patterns must remain avoidable at increasing speed. Finish or exit safely back to survival with earned supplies and a capped bonus. Track runner performance separately from survival best; no accounts or shared online leaderboards.

## Delivery order and gates

1. Finish combat + YEET and verify actual collision, input, damage, navigation, cooldowns and audiovisual feedback.
2. Improve the rider and course, then verify skateboard momentum, trick timing, ramps/halfpipes, grind entry/exit and hop-off transitions.
3. Implement runner simulation and portal lifecycle, verify source-faithful controls/pickups, fair patterns and preserved survival state.
4. Polish desktop and mode-specific mobile controls, sounds, start/end/restart, progression and first-ten-minute pacing.
5. Verify browser play, source preservation, production build and tests; record limitations honestly. Save Git history and leave a local preview with simple launch instructions. Stop at a finished first playable.

Status: all three modes and combat YEET are implemented for the first playable. The course uses five rails, five two-way banks and two curved halfpipes; separate quarter pipes were folded into the halfpipe transitions. Browser mechanics checks, touch gestures, build and source-preservation checks are recorded in TESTING.md. Human ten-minute pacing and physical-device performance remain unverified; passing fixtures is not a claim of those results.
