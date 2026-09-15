# Editor E2E Test Suite

Playwright 1.59 end-to-end tests that drive the real PlayCanvas Editor against a deployed
backend (`dev.playcanvas.com`) while loading the frontend bundles from your local
`npm run develop` build.

## Prerequisites

- Node >= 22 (repo `.nvmrc`).
- `npm run build` **at the repo root**, or `npm run develop` for a watched build.
  Playwright starts the `dist/` server and waits for `editor.js` to respond; locally it can reuse
  a server already running on `http://localhost:3487`. `PC_LOCAL_FRONTEND=true` makes every editor URL carry
  `use_local_frontend` so the page pulls `editor.js` / `editor.css` from there instead of the
  deployed bundle.
- `npm install` in `test-suite` (Playwright browsers: `npx playwright install chromium`).
- `.env` in `test-suite`, copied from `.env.template`:

  | Key | Purpose |
  | --- | --- |
  | `PC_HOST` | backend host, e.g. `dev.playcanvas.com` |
  | `PC_LAUNCH_HOST` | launch host for `launch.test` pages |
  | `PC_LOGIN_HOST` | login host |
  | `PC_COOKIE_NAME` / `PC_COOKIE_VALUE` | session cookie of a `testSuite`-flagged account |
  | `PC_HEADER_NAME` / `PC_HEADER_VALUE` | CloudFront header injected by `lib/middleware.ts` |
  | `PC_LOCAL_FRONTEND` | `true` loads the frontends from `localhost:3487`; unset tests the deployed frontend |
  | `PC_COLLAB_USERNAME` | username of the second account, needed by `test/ui/team.test.ts` |

  The account behind `PC_COOKIE_VALUE` must have the `testSuite` flag; `test/auth.setup.ts`
  fails fast with `test suite flag not present on account` otherwise.

## Running everything

```sh
npm test          # playwright test
CI=true npm test # run with CI behaviour locally
npm run test:gate # the @gate subset, minus @slow
npm run test:clean # separately remove stale projects
npm run report    # open the last html report
```

`test:gate` is the tier to run on a change: the `@gate` tag covers smoke, assets, hierarchy,
inspector, the generic component loop, scenes, version control, persistence, templates, launch
hot reload and one launcher combo. `--grep-invert @slow` keeps the launcher matrix out of it.
Run the full `npm test` suite before a rollout; the gate omits script editing, collaboration,
permissions, publishing and most launcher combinations.

`playwright.config.mjs` defines two projects that run in a chain:

1. **auth** — `test/auth.setup.ts`, proves the cookie is valid and `testSuite`-flagged.
2. **suite** — every spec under `test/`, depends on `auth`.

`test:clean` uses `playwright.clean.config.mjs` to authenticate and delete leftovers separately
from the test run. It only deletes `e2e-` projects from other runs older than `STALE_PROJECT_AGE`
(2 hours). It preserves projects with missing or unreadable creation dates. Tests still delete
their own projects in teardown; export/import cleanup resolves owned ids and skips copies already
deleted by the test. Run stale cleanup periodically on the dedicated test account.

`workers` equals the number of cookies in `PC_COOKIE_VALUE` (one account per worker) and
`fullyParallel` is `false`, because the tests in a file share the per-worker `project` fixture.
Default per-test timeout is 2 minutes; retries are 1 in CI and 0 locally. CI fails on flaky tests;
the retry collects diagnostics rather than allowing a flaky pass to approve a rollout.
Video is off because the suite owns shared contexts. Traces are collected on the first CI retry
and retained on local failures. `trace` still gives a trace per test — playwright chunks the trace of a context it
created through the `browser` fixture per test, even a worker-scoped one like `editorContext`.

Every normal run writes `playwright-report/` and `test-results/results.json`, including test
durations, retries and skips. `npm test` and `test:gate` preserve these reporters. A CLI
`--reporter=list` override disables report files, which is useful for discovery with `--list`.

## Rollout integration and timing

The GitHub `Test Suite / Run` workflow runs the full suite with cached npm dependencies and
Chromium. It builds the checked-out frontend once, or accepts a `dist/` artifact from a calling
workflow so the tests exercise the artifact intended for promotion. Playwright manages the
frontend server and its readiness, including in Docker (`PC_FRONTEND_DIR=/usr/src/app`).

The rollout workflow can call it after building and uploading its candidate:

```yaml
e2e:
  needs: build
  uses: ./.github/workflows/test-suite-run.yml
  with:
    env: dev
    artifact: editor-dist
  secrets: inherit
```

Make the promotion job depend on `e2e` and promote that same artifact. This repository's release
workflow only creates a GitHub release; the PROD deployment pipeline must add that dependency.
The GitHub `Test Suite / CI` workflow runs lint and types, not browser E2E.
Both reports are uploaded even when browser tests fail. Check skips as well as failures:
collaboration needs a second account, team tests need its username, and engine/component
capabilities can be absent on the target environment.

Measure the full suite on one worker before adding concurrency:

```sh
npm test -- --workers=1
```

Compare the JSON report's `stats.duration` and per-test result durations for the same tests and
backend. Keep navigation, persistence, UI creation and the API launcher matrix covered. The
worker fixture reuses the Editor page loaded during project setup and deletes through the API,
avoiding a second Editor load, an idle rendering tab and a picker reload during teardown.
Store tests use the successful search response to identify empty data and check the rendered
result. They skip an empty store immediately; a failed request or missing card for a non-empty
response fails instead of being treated as an empty store after a timeout.

## Running one spec while developing

```sh
npx playwright test --project=suite --no-deps --reporter=list \
  --output=test-results/my-run test/ui/hierarchy.test.ts
```

- `--no-deps` skips authentication. Use it only after checking that account in the current session.
- `--output=<dir>` moves the artifacts (traces, videos, screenshots) out of the shared
  `test-results` directory. Playwright wipes the output directory at the start of a run, so two
  runs sharing it destroy each other's artifacts mid-flight.
- `test/auth.setup.ts` and `test/clean.setup.ts` cannot run under `--project=suite`: that
  project has no `testMatch`, so it uses the default `**/*.{test,spec}.ts`, which never matches
  a `*.setup.ts`. Run the auth check as `npx playwright test --project=auth --reporter=list`;
  the `auth` project has no dependencies, so `--no-deps` is unnecessary there.

The engine/build/device matrix (18 combinations) lives in `test/api/basic.test.ts`, which drives
the launch url directly; one of them carries `@gate` and the other 17 are `@slow`. The copy in
`test/ui/basic.test.ts` exists for the settings and launch-option ui, so it is a single
representative combo, as is the classic/esm publish/download pair. Skip every `@slow` test with:

```sh
npx playwright test --project=suite --no-deps --grep-invert @slow
```

## A second account

`lib/config.ts` splits `PC_COOKIE_VALUE` on commas into `AUTH_STATES`. Adding a second
`testSuite`-flagged cookie:

```
PC_COOKIE_VALUE=<cookie-a>,<cookie-b>
```

- raises `workers` to 2 (each worker takes `AUTH_STATES[parallelIndex % length]`), and
- makes the `collaborator` fixture a real second `BrowserContext` instead of `null`, which
  un-skips the realtime and permissions tests (they `test.skip(!collaborator, 'needs a second
  testSuite account cookie')`).

`test/ui/team.test.ts` invites a second account by username, which cookies cannot supply, so it
needs `PC_COLLAB_USERNAME=<username of the second account>` and skips the whole file without it.

## One editor page per worker

`editorContext` and `sharedEditor` are worker-scoped: a worker opens one browser context, loads
the editor once, and every test that asks for `editorPage` is handed that same page after
`EditorShell.reset()` has put it back — reload only if the last test navigated away or failed,
then Escape, close every picker by name, `selector:clear`, un-expand the viewport, restore the
viewport size and the assets panel's folder, search and view mode, and finally `restore()` the
project. `blankPage` and the `page` fixture open a fresh page per test inside the same context;
`codeEditorPage` and `openLaunch` open their own pages and close them on teardown; `collaborator`
and the specs that own a project (version control, texture convert, `basic`) keep
their own contexts.

What this costs a spec: anything page-scoped it changes now outlives it, and `reset()` is where
the fix belongs when the leak is editor state (an open picker, a hovering tooltip, the gizmo mode,
an assets panel filter) rather than spec state. `test/ui/settings.test.ts` puts the in-memory
session engine version back in its `afterEach` because only it knows the value, and a spec that
ends on another scene has to come back (or leave `reset()` to reload for it). A request a spec
left in flight also now answers into the next test's console capture, which is why
`test/ui/assets.test.ts` waits for a created asset's file before its cleanup deletes it.

## Specs restore the shared project

The `project` fixture is worker-scoped, so every spec in a run edits the same project and has to
hand it back the way it was given. Take a baseline in `beforeEach` and drop the delta in
`afterEach` with the shared helper — `EditorShell.snapshot()` returns the entity and asset ids the
project holds, `EditorShell.restore(snapshot)` deletes everything added since (entities with
`history: false`, assets through the backend, polled until the registry drops them) and never
touches the project's stock entities or assets. Leaving state behind is not a private matter:
`test/ui/inspector.test.ts` used to leave a 1x1 png texture in the project and it later failed
`test/ui/smoke.test.ts` 'launch page runs', because the launch page loaded that texture and the
console capture saw the decode error. A spec that owns its own project instead (version control,
texture convert, `test/ui/basic.test.ts`) creates it in `beforeAll` and deletes it in
`afterAll`.

## Console errors

Every test gets the auto `errors` fixture: `lib/console.ts` attaches to the context (and to
pages opened later, including popups), records `console.error` and `pageerror`, attaches the full
console/response log to the report, and fails the test if anything unexpected was logged. The
context is worker-scoped, so `attachConsoleCapture` returns its own detach and the fixture calls
it on teardown; one test never sees another's output.

- Prefer `errors.allow(/message/)` inside the one test that provokes a benign error, with a
  comment saying why the scenario cannot avoid it.
- `CONSOLE_ALLOWLIST` in `lib/constants.ts` suppresses an error for the whole suite. It starts
  empty and every entry must carry a comment naming the source of the benign error.

## Fixtures

From `lib/fixtures.ts` — import `test` and `expect` from there, never from `@playwright/test`:

| Fixture | Scope | What you get |
| --- | --- | --- |
| `project` | worker | `{ id, name, sceneId }` of a fresh project created once per worker and deleted in teardown |
| `editorPage` | test | the worker's one editor page on `/editor/scene/<project.sceneId>`, reset |
| `blankPage` | test | `/editor` project CMS, ready |
| `codeEditorPage` | test | `/editor/code/<project.id>` in a second page, ready, closed on teardown |
| `openLaunch` | test | `(sceneId, params?) => Page` on the launch host, ready |
| `collaborator` | test | second-account `BrowserContext`, or `null` with one cookie |
| `errors` | test (auto) | console capture, asserted empty on teardown |
| `authState` | worker | this worker's storage state |
| `editorContext` | worker | the context every page but a collaborator's lives in |
| `sharedEditor` | worker | `{ page, base }` — the editor page and the baseline `reset()` restores |

Readiness is always a state signal, never `networkidle` or a sleep (`lib/ready.ts`):

- editor — `body.editor-ready`
- code editor — `body.code-editor-ready`
- launch — `pc.app` present, then its `frameend` until `frame > 0` and the splash wrapper gone

## Waits are armed, never timed

`grep -rE "waitForTimeout|setTimeout\(resolve" lib test` comes back empty and has to stay that
way. A wait is either a page load or a subscription to the editor event that signals the step,
armed **before** the action and awaited after it. `arm` in `lib/arm.ts` (and `EditorShell.arm`,
bound to a page) is the plumbing: the page function it takes returns `{ done }`, already resolved
when the state the event announces holds, and the thunk it hands back awaits that once the action
is under way.

```ts
const selected = await shell.arm((n: string) => {
    const selection = window.editor.api.globals.selection;
    const hit = () => selection.items.some((i: any) => i.get('name') === n);
    if (hit()) {
        return { done: Promise.resolve() };
    }
    return { done: new Promise<void>((resolve) => {
        const evt = window.editor.on('selector:change', () => {
            if (!hit()) {
                return;
            }
            evt.unbind();
            resolve();
        });
    }) };
}, name);
await row.click();
await selected();
```

It subscribes to whatever the page has: the editor Caller (`window.editor.on`), an editor-api
emitter (`globals.history.on('add')`, `globals.jobs.on('finish')`, `globals.assets.on('remove')`),
an asset observer (`'*:set'`), or the engine app (`app.on('frameend')`). Pass a cap
(`{ what, timeout }`) where a missed event should name itself instead of running the test out of
time.

A condition wait (`page.waitForFunction`) is only allowed where the editor emits nothing, and
every one of them carries a comment naming the hook that is missing. There are four in `lib`: the
launch page's engine global, the pcui drop manager's flag, a vc reload (which destroys the page
and every subscription on it) and the viewport gizmo, which is rebuilt from the render loop.
`expect.poll` stays where it asserts a final value rather than stands in for an event.

## Job-backed tests

Anything that waits on a backend job (project create/fork/delete, export/import, build,
publish, app delete) must wait with `JOB_TIMEOUT` from `lib/constants.ts` (3 minutes) **and**
raise its own budget past it:

```ts
test('delete project', async ({ blankPage }) => {
    test.setTimeout(JOB_TEST_TIMEOUT);
    await deleteProject(blankPage, projectId);
    await expect.poll(() => projectIds(blankPage), { timeout: JOB_TIMEOUT }).not.toContain(projectId);
});
```

`JOB_TEST_TIMEOUT` (4 minutes) is in `lib/constants.ts` for exactly this; a `beforeAll` that
waits on a job needs the same `test.setTimeout` inside the hook. Without it, the 2-minute default
test timeout fires first and you lose the job-specific failure message. Playwright's own 5-second default on `expect.poll` /
`toHaveCount` is far too short for a job.

## Lint and types

```sh
npm run lint
npm run lint:fix
npm run type:check   # regenerates .editor-api-types, then tsc
```
