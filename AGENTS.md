# Church Street: Last Light

This is the standalone zombie + skate game. Do not change the source project at `/Users/stephendavis/Projects/church-street-world` or the original skate project as part of work here.

Preserve the approved world modules and data listed in `docs/environment-manifest.json`. Add gameplay and fictional skate pieces separately under `src/game/`. Read README.md and docs/TESTING.md before changes. Desktop and mobile controls are both required; ensure overlay stacking does not intercept SKATE or other HUD buttons.

Use `npm test`, `npm run build`, and real-browser behavior checks for meaningful gameplay changes. `?qa=1` on the dev server provides a visible integration panel with separate test scores and is stripped from production builds. Don't confuse scripted transition checks with a full human ten-minute playtest.

The user authorized public publishing to BTown Arcade on September 5. Main deploys through GitHub Actions to `https://play.btownbrief.com/church-street-zombies/`. Register discovery in the arcade repo games.json; the Hub and shared search consume that feed. No accounts, multiplayer or analytics without a user request. Use built-in search/fetch or curl first; do not use paid Firecrawl without the user's policy exceptions. Never print credentials.
