# Editor E2E Test Suite

Playwright 1.59 end-to-end tests that drive the real PlayCanvas Editor against a deployed
backend (`dev.playcanvas.com`) while loading the frontend bundles from your local
`npm run develop` build.

## Prerequisites

- Node >= 22 (repo `.nvmrc`).
- `npm run develop` running **at the repo root**. It builds and serves `dist/` on
  `http://localhost:3487`; `PC_LOCAL_FRONTEND=true` makes every editor URL carry
  `use_local_frontend` so the page pulls `editor.js` / `editor.css` from there instead of the
  deployed bundle. Check it with `curl -s -o /dev/null -w '%{http_code}' http://localhost:3487/js/editor.js`.
- `npm install` in `test-suite` (Playwright browsers: `npx playwright install chromium`).
- `.env` in `test-suite`, copied from `.env.template`:

  | Key | Purpose |
  | --- | --- |
  | `PC_HOST` | backend host, e.g. `dev.playcanvas.com` |
  | `PC_LAUNCH_HOST` | launch host for `launch.test` pages |
  | `PC_LOGIN_HOST` | login host |
  | `PC_COOKIE_NAME` / `PC_COOKIE_VALUE` | session cookie of a `testSuite`-flagged account |
  | `PC_HEADER_NAME` / `PC_HEADER_VALUE` | CloudFront header injected by `lib/middleware.ts` |

  `PC_LOCAL_FRONTEND=true` is **not** in the template — add it yourself to load the frontends
  from `localhost:3487`. Without it the suite tests the deployed frontend.

  The account behind `PC_COOKIE_VALUE` must have the `testSuite` flag; `test/auth.setup.ts`
  fails fast with `test suite flag not present on account` otherwise.

## Running everything

```sh
npm test          # playwright test
npm run test:ci   # playwright test --reporter list
npm run report    # open the last html report
```

`playwright.config.mjs` defines three projects that run in a chain:

1. **auth** — `test/auth.setup.ts`, proves the cookie is valid and `testSuite`-flagged.
2. **clean** — `test/clean.setup.ts`, **deletes every project on the account whose name starts
   with `e2e-`**, so leftovers from a crashed run do not accumulate. This is destructive to any
   other `e2e-*` project on that account, including one a concurrent run is using.
3. **suite** — every spec under `test/`, depends on `clean`.

`workers` equals the number of cookies in `PC_COOKIE_VALUE` (one account per worker) and
`fullyParallel` is `false`, because the tests in a file share the per-worker `project` fixture.
Default per-test timeout is 2 minutes; retries are 2 in CI and 0 locally.

## Running one spec while developing

```sh
npx playwright test --project=suite --no-deps --reporter=list \
  --output=test-results/my-run test/ui/hierarchy.test.ts
```

- `--no-deps` skips the `auth` and `clean` dependencies. Without it every single-spec run
  re-runs `clean`, which deletes the `e2e-*` projects belonging to anyone else running the suite
  at the same time.
- `--output=<dir>` moves the artifacts (traces, videos, screenshots) out of the shared
  `test-results` directory. Playwright wipes the output directory at the start of a run, so two
  runs sharing it destroy each other's artifacts mid-flight.
- `test/auth.setup.ts` and `test/clean.setup.ts` cannot run under `--project=suite`: that
  project has no `testMatch`, so it uses the default `**/*.{test,spec}.ts`, which never matches
  a `*.setup.ts`. Run the auth check as `npx playwright test --project=auth --reporter=list`;
  the `auth` project has no dependencies, so `--no-deps` is unnecessary there.

Skip the launcher matrix (18 engine/build/device combinations in each of
`test/ui/basic.test.ts` and `test/api/basic.test.ts`, 36 of the suite's 193 tests) with:

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

## Console errors

Every test gets the auto `errors` fixture: `lib/console.ts` attaches to the context (and to
pages opened later, including popups), records `console.error` and `pageerror`, attaches the full
console/response log to the report, and fails the test if anything unexpected was logged.

- Prefer `errors.allow(/message/)` inside the one test that provokes a benign error, with a
  comment saying why the scenario cannot avoid it.
- `CONSOLE_ALLOWLIST` in `lib/constants.ts` suppresses an error for the whole suite. It starts
  empty and every entry must carry a comment naming the source of the benign error.

## Fixtures

From `lib/fixtures.ts` — import `test` and `expect` from there, never from `@playwright/test`:

| Fixture | Scope | What you get |
| --- | --- | --- |
| `project` | worker | `{ id, name, sceneId }` of a fresh project created once per worker and deleted in teardown |
| `editorPage` | test | `/editor/scene/<project.sceneId>`, ready |
| `blankPage` | test | `/editor` project CMS, ready |
| `codeEditorPage` | test | `/editor/code/<project.id>` in a second page, ready, closed on teardown |
| `openLaunch` | test | `(sceneId, params?) => Page` on the launch host, ready |
| `collaborator` | test | second-account `BrowserContext`, or `null` with one cookie |
| `errors` | test (auto) | console capture, asserted empty on teardown |
| `authState` | worker | this worker's storage state |

Readiness is always a state signal, never `networkidle` or a sleep (`lib/ready.ts`):

- editor — `body.editor-ready`
- code editor — `body.code-editor-ready`
- launch — `pc.app.frame > 0` and the splash wrapper gone

## Job-backed tests

Anything that waits on a backend job (project create/fork/delete, export/import, build,
publish, app delete) must wait with `JOB_TIMEOUT` from `lib/constants.ts` (3 minutes) **and**
raise its own budget past it:

```ts
test('delete project', async ({ blankPage }) => {
    test.setTimeout(4 * 60 * 1000);
    await deleteProject(blankPage, projectId);
    await expect.poll(() => projectIds(blankPage), { timeout: JOB_TIMEOUT }).not.toContain(projectId);
});
```

Without the `test.setTimeout`, the 2-minute default test timeout fires first and you lose the
job-specific failure message. Playwright's own 5-second default on `expect.poll` /
`toHaveCount` is far too short for a job.

## Lint and types

```sh
npm run lint
npm run lint:fix
npm run type:check   # regenerates .editor-api-types, then tsc
```
