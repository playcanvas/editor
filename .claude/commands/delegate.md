---
name: delegate
description: Delegate a task — worktree, implement, verify, commit, review, PR
user_invocable: true
---

# Delegate: **$ARGUMENTS**

## 1. Branch name

Pick prefix: `feat/`|`fix/`|`chore/`|`refactor/`|`docs/`|`test/`|`perf/`|`ci/`|`build/`|`style/`
Append kebab-case suffix (3-5 words). E.g. `feat/add-entity-shortcuts`

## 2. Create worktree + spawn background subagent

```
git worktree add -b <branch> .claude/worktrees/<branch> HEAD
```

Spawn `general-purpose` Task (`run_in_background: true`). Replace `{{WORKTREE}}`, `{{BRANCH}}`, `{{TASK}}` in prompt below.

### Subagent prompt

```
Task: {{TASK}}
Worktree: {{WORKTREE}}
Branch: {{BRANCH}}

All commands use absolute paths in worktree.

1. SETUP: `npm install`. Read CLAUDE.md (and AGENTS.md if exists) for conventions.

2. IMPLEMENT: Make changes per task. Follow CLAUDE.md rules.

3. VERIFY (max 5 cycles): Read package.json for lint/type-check/build/test scripts. Run sequentially. Skip tests using Docker/Playwright. Fix failures and retry. After 5 cycles, note remaining failures and proceed.

4. COMMIT: Follow /commit conventions. Stage specific files only (no `git add -A`). Format: `type: message`. No Co-Authored-By/AI attribution. Multiple commits for separate logical changes.

5. REVIEW (max 3 cycles): Follow /review conventions. `git diff main...HEAD`. Check perf/minimal-diff/style/correctness/security/CLAUDE.md. Issues found → fix → re-verify → re-commit → re-review.

6. PR: Follow /pr conventions. `git push -u origin {{BRANCH}}`. `GIT_SSL_NO_VERIFY=1 gh pr create` — title `[TYPE] Description`, `--assignee @me --base main`, `--label <type>` if exists. Capture PR URL.

7. CLEANUP: `git worktree remove {{WORKTREE}}` (note if fails). Report: branch, PR URL, commit count, files changed, unresolved failures, cleanup status.
```

## 3. Report

Tell user: branch name, background status, output file path for progress, PR created when done.
