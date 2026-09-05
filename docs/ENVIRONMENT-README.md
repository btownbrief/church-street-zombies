# Church Street — Burlington, Vermont

A reusable exterior world covering the four pedestrian blocks from Pearl Street to Main Street (approximately 500.75 metres), with the meeting house at the north end and City Hall/Firehouse at the south end. PlayCanvas renders the world in the browser; a GLB exporter provides editable geometry for Blender.

**This is an unfinished reconstruction, not a verified one-to-one survey.** Ground layout is based on municipal GIS and terrain on numerical 2023 lidar-derived DEM data. Many facade dimensions, furniture positions and hidden surfaces remain interpretations of the supplied videos. Business signs reflect source footage dates rather than a current directory.

## Run locally

```sh
cd /Users/stephendavis/Projects/church-street-world
npm ci
npm run dev -- --port 5185 --strictPort
```

Open http://localhost:5185/ on this Mac. The development server also listens on the local network. Build with `npm run build`. This project has not been published publicly.

Move with WASD/arrow keys; drag to look around; Shift moves faster. The street-jump buttons, overview and guided walk cover the full corridor. Phone-width controls are included, but physical iPhone performance is unverified. This is an environment/exploration prototype; skating and zombie gameplay are not implemented.

## Files and coordinates

- `src/world.js`: reusable environment assembly, street surfaces, terrain interpolation and walk boundaries.
- `src/architecture.js` and `src/facade-catalog.js`: frontage geometry and source-era facade interpretations.
- `src/church-landmark.js`, `src/south-landmarks.js`, `src/whim-infill.js`: individually modeled landmarks.
- `src/street-props.js`: trees, lamps, benches and other street furniture.
- `src/data/geography.json`: municipal footprint context and crossing locations.
- `src/data/frontages.json`: 55 frontage records. Several records can belong to one building; this is not a claim of 55 distinct buildings.
- `src/data/grade.json`: 307 terrain samples at 2-metre intervals, z −110 to 502. The roughly 9.6-metre Pearl-to-Main fall is derived from the 2023 DEM. Cross-street slope is not modeled.
- `export.html` / `src/export-world.js`: development-time GLB export. The production build currently bundles the main exploration page only.
- `public/research.html`: source evidence gallery, being restored from the original work.

World units are metres: x east, z south, y up. The local horizontal origin is at Pearl/Church, approximately longitude −73.21276793051794, latitude 44.480447742992. The vertical offset is 69.682 metres relative to NAVD88/GEOID18 terrain elevations; it is a numerical scene origin, not a claim that Pearl is exactly that elevation.

## Evidence and fidelity limits

The supplied aerial clip (`NgYmD7ylA0k`, about one minute) provides roof/layout views; the walking tour (`XMMZhJdRkWA`, about 13m50s) provides street-level facades. Both original MP4s remain in Downloads. The videos are from different years and are not a simultaneous survey. No licensed Google/Apple imagery has been baked into these assets.

Municipal footprints constrain horizontal placement. Reconstructed frontage anchors match all 55 original logged anchors. VCGI 2023 DEM/DSM rasters constrain ground and measured visible roof surfaces. Six inspected roof planes now constrain roof surfaces independently of their front facades. The two low shops immediately south of Masonic now use provisional 4.7m and 6.3m facade caps instead of identical 9.2m envelopes. A roof surface is not automatically the height of its street-facing parapet. Glass, vegetation, thin spires and HVAC equipment require special interpretation.

A sparse aerial reconstruction and five manually triangulated corners have been investigated. The regenerated 40-frame model has 8,486 sparse points and 1.934 metres error at the entirely withheld College Street corner; this does not establish centimetre accuracy. Scripts, fitted camera transforms and aligned points are in `research/sfm`. The original dense reconstruction experiment was distorted and was rejected as game geometry.

Historical architectural references were also consulted, including the [UVM architectural history](https://www.uvm.edu/~hp206/2017/pages/Henderson/index.html). Historical measurements must not silently override current observed geometry.

## Recovery and verification

The original `Documents/Codex` workspace was deleted by a separate cleanup command on September 5, 2026. This is the new primary working project. The surviving 04:11 local-time GLB and an independently reopened Blender reconstruction are preserved in `~/Downloads/Church-Street-Recovery-2026-09-05/`; they predate the latest Whim and DEM terrain updates.

Source was recovered from recorded literal file writes, read outputs and reviewed patches. GIS/elevation data was refetched; all six checked landmark measurement sets reproduce the original results exactly. Detailed recovery manifests remain in the Downloads recovery directory. The complete browser app passes a production build after recovery. Post-recovery browser rendering and interaction checks remain outstanding because the browser tool could not verify its security policy. A successful build is not evidence of visual fidelity.

No paid capture service or Firecrawl pages were used in recovery. All exported geometry remains a work in progress.
