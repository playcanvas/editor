# Editor E2E Test Suite

Playwright tests for the Editor, Code Editor and Launch, using a real backend with
local or deployed frontend bundles.

## Setup

Use Node >= 22. From the repository root:

```sh
npm ci
npm run build                 # or npm run develop for a watched build
cd test-suite
npm ci
npx playwright install chromium
cp .env.template .env
```

Configure `.env`:

- `PC_HOST`, `PC_LOGIN_HOST`, `PC_LAUNCH_HOST`: target backend, login and launch hosts.
- `PC_COOKIE_NAME`, `PC_COOKIE_VALUE`: session cookie for a dedicated account with the
  `testSuite` flag. Authentication checks this before running tests.
- `PC_HEADER_NAME`, `PC_HEADER_VALUE`: access header, if required by the environment.
- `PC_LOCAL_FRONTEND=true`: load local bundles. Playwright serves `dist/` on port 3487
  and can reuse an existing local server. Unset to test deployed bundles.
- `PC_EMAILS`: comma-separated account emails, in the same order as `PC_COOKIE_VALUE`.
  Authentication verifies every email matches its cookie and every account has `testSuite`.

## Run

Run these commands from `test-suite/`:

```sh
npm test                         # full E2E suite, including optional capabilities
npm test -- test/ui/hierarchy.test.ts # one spec, including authentication
npm run test:clean               # remove stale test projects
npm run report                   # open the HTML report
npm run lint
npm run type:check
```

`npm test` runs the same full suite locally and in CI, with no automatic retries.
Failures fail the run; `test.only` and flaky results are rejected. Intentional skips
remain visible in the reports for unavailable accounts, engine versions, component
flags and store content. There is no separate gate or release suite.

Each worker uses one account and reuses its Editor page and project. Comma-separated
cookies in `PC_COOKIE_VALUE` enable additional workers and collaboration tests. Configure
matching emails in `PC_EMAILS` for team invitations; usernames are resolved from the
authenticated accounts. To measure with one worker, use `npm test -- --workers=1`.

Tests delete their own projects during teardown. The separate clean config authenticates
and deletes `e2e-` projects from other runs older than two hours, preserving projects with
missing or unreadable creation dates.

## Reports and CI

Runs write `playwright-report/` and `test-results/results.json`, including durations,
retries and skips. Local and CI runs retain failure traces and screenshots. Video is disabled.

For overlapping runs, give each a distinct `--output` directory and set separate
`PLAYWRIGHT_HTML_OUTPUT_DIR` and `PLAYWRIGHT_JSON_OUTPUT_FILE` paths to prevent overwrites.

[Test Suite / CI](../.github/workflows/test-suite-ci.yml) runs lint and types.
[Test Suite / Run](../.github/workflows/test-suite-run.yml) builds the frontend, runs `npm test`
and uploads reports for manual and PR-label runs.

The monorepo's `suite:editor` label runs separately through SnapCI. It builds
`suites/editor` from the published test image pinned to the Editor submodule SHA,
injects backend test configuration and runs `npm test` against DEV. A failed suite
fails the SnapCI job. This path does not call the GitHub test workflow or use local
frontend artifacts; suites are skipped in non-DEV environments.

## Writing tests

- Import `test` and `expect` from [lib/fixtures.ts](lib/fixtures.ts). Use `editorPage`,
  `blankPage`, `codeEditorPage`, `openLaunch` and `collaborator` for the relevant surface.
  Reuse the page objects in [lib/pages](lib/pages).
- The Editor page and project are shared within a worker. Use `EditorShell.snapshot()`
  and `restore()` around tests that add entities or assets; explicitly restore changes to
  existing data and settings. Shared UI reset belongs in `EditorShell.reset()`. Specs that
  create their own project must delete it in `afterAll`.
- Wait for observable state or events, never fixed delays or `networkidle`. Use the
  [readiness helpers](lib/ready.ts) and arm event waits with `EditorShell.arm()` or
  [arm](lib/arm.ts) **before** triggering the action. Use condition polling only when no
  event exists, with a short comment explaining the missing hook.
- Backend jobs use `JOB_TIMEOUT` (3 minutes). Set `test.setTimeout(JOB_TEST_TIMEOUT)`
  (4 minutes) in affected tests and setup hooks so the default 2-minute budget does not
  interrupt them. Both constants live in [lib/constants.ts](lib/constants.ts).
- Unexpected console errors fail tests. Allow unavoidable errors narrowly with
  `errors.allow(/message/)` and explain why; suite-wide allowances belong in
  `CONSOLE_ALLOWLIST` with a source comment.
