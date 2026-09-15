# Editor release coverage

## Boundary

Exercise fresh-project user journeys through Editor, Code Editor and Launch against a
real backend. New user-workflow tests use API setup to prepare fixtures and read back
persisted results; the operation under test goes through its user-facing control.
Existing API and realtime smoke tests provide complementary integration coverage.
Do not use existing
customer projects. `../monorepo` is a reference: its assets-server and pipeline
E2E suites own service contract permutations, job internals and converter edge cases.

## Journey contracts

- Hierarchy and inspector: create, select, duplicate subtrees with remapped references,
  reparent, delete, multi-edit differing values, undo/redo and reload persistence.
- Assets: create, upload, navigate folders, move, rename, tag, filter, duplicate, paste,
  delete and edit inspector values; import a model and splat through the file picker,
  assign the generated resource, launch, and reimport without losing references.
- Templates: create and instantiate, apply/revert overrides, propagate to another
  instance without moving it, preserve overrides through reload, nested unlink/history.
- Components: add/remove/copy/paste, edit values and references, history restoration;
  import a font and regenerate glyphs, render assigned text, play imported animation,
  create all five joint types and verify constraints plus slider motor movement.
- Code and scripts: independent dirty tabs, rename/save/reopen, classic and ESM parsing,
  invalid-code repair, attribute changes, execution in Launch and surfaced runtime errors.
- Specialized editors: animation graph edits and persistence, sprite generation,
  undo/redo and exact restored frames; viewport tools and rendered gizmo completion.
- Scenes and settings: create/duplicate/rename/delete/switch scenes, change project and
  scene settings, flush pending operations and verify them after reload.
- Collaboration: two distinct test accounts, remote edits, reconnect convergence,
  continued editing, read/write changes, revocation, team invitations and role persistence.
- Version control and delivery: branch isolation, checkpoints, restore and merge with
  real entity changes; populated project export/import; downloaded and published apps
  boot with the authored content rather than merely returning a successful job.

These contracts are coverage targets, not a claim that every path or browser is proven.
The suite currently targets Chromium. Exhaustive property combinations, cross-browser
coverage and deployment orchestration are separate follow-up work.

## Completion rules

1. Arm observer, realtime, messenger, network or Engine frame events before the action.
   If the state may already exist, check it while subscribing. Use DOM assertions for
   visible completion. Never use fixed delays, `networkidle` or elapsed time as success.
   Condition polling is a last resort only where no observable hook exists, with the
   missing hook documented beside the wait. Timeouts only bound failure.
2. Assert the actual result: identifiers and references, restored values, persisted data,
   or running/rendered content. A completed request alone is not an end-to-end assertion.
3. Run focused checks while developing, then `npm run test:release` against the candidate
   artifact. All tests must run and pass once; missing capabilities, skipped tests,
   failures, retries and partial selections block the release report.
4. Keep environment failures and product regressions visible. Track any backend fixes
   separately; do not mock their outcomes, suppress errors or weaken checks.
5. Promotion must depend on the successful release check and consume the same artifact
   hash recorded in `test-results/release.json`. Wiring an external PROD deployment is
   outside this repository; this suite does not itself enforce that dependency.

## Environment prerequisites

- Matching comma-separated `PC_EMAILS` and `PC_COOKIE_VALUE` lists for at least two
  distinct accounts with `testSuite`; component feature flags needed by the suite.
- Working realtime/messenger, collaboration requests, conversion workers, publishing,
  download/export/import and source-asset storage.
- A supported importable asset-store model, enabled engine
  versions, WebGL2/WebGPU support, and trusted TLS certificates for the release profile.
- Built candidate `dist/`, `PC_LOCAL_FRONTEND=true`, and a free frontend-server port.

Physics tests upload bundled Ammo fixtures and do not require store setup or privileged
accounts. Tiny model/splat fixtures are generated deterministically; fixture provenance is documented
in [test/fixtures/README.md](test/fixtures/README.md). Credentials and browser artifacts
stay out of version control.

## Local verification snapshot

Against the candidate Editor bundle and corrected Docker Desktop pipeline on 2026-09-15:

- Five joint workflows passed with bundled Ammo, including slider motor movement.
- Four model/splat workflows passed, including reimport and animation in Launch.
- All 14 collaboration, permissions and team checks passed, including authentication.
- Suite lint and TypeScript checks passed.

This is not a green full release run. Earlier runs exposed duplicate sprite frames after
redo, a missing populated-project import completion modal and an intermittent checkpoint
history timeout. Empty-store and unavailable-component skips also block the release gate.
Keep these assertions and resolve or explicitly triage the failures before promotion.
