---
name: review
description: Review current branch against main — performance, minimal diff, style, lint, types
user_invocable: true
---

# Review Current Branch

Priorities: **performance** > **minimal diff** > **consistent style**

## 1. Gather context (parallel)
- `git log --oneline main...HEAD`
- `git diff main...HEAD --stat`
- Lint (find command in `package.json` or CLAUDE.md)
- Type-check (find command in `package.json` or CLAUDE.md)

## 2. Review commits (spawn subagent per commit, parallel)

Each subagent runs `git diff <commit>~1 <commit>` and `git log -1 --format='%s%n%n%b' <commit>`.

Check for:

- **Performance:** redundant loops, O(n²), heavy main-thread work, missing caching, layout thrashing
- **Minimal diff:** unrelated changes, reformatting that belongs in separate commit, duplicated utils
- **Style:** naming conventions, consistency with surrounding code, public API type annotations
- **Correctness:** logic errors, null access, race conditions, missing error handling, side effects
- **Security:** injection, XSS, leaked secrets, hardcoded URLs/config
- **Conventions:** CLAUDE.md violations

Return per finding: file path, line, severity (error/warning/nit), description. Return "No issues" if clean.

## 3. Compile report
- Lint/type errors first
- Group by severity: errors → warnings → nits
- Include commit hash + title per finding
- Short overall assessment at end
