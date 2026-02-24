---
name: pr
description: Create a pull request with conventional format from current branch
user_invocable: true
---

# Create PR

## 1. Gather context (parallel)
- `git status` (no `-uall`)
- `git diff` (staged + unstaged — commit remaining changes first)
- `git log --oneline -10`
- `git diff main...HEAD` (full branch diff)
- Check if branch tracks remote and is up to date

## 2. Push
`git push -u origin <branch>` if needed.

## 3. Create PR
- Prefix all `gh` commands with `GIT_SSL_NO_VERIFY=1` to work around TLS certificate issues
- **Title:** `[TYPE] Short description` (under 70 chars)
- **Body:** Follow `.github/PULL_REQUEST_TEMPLATE.md` if present, otherwise use concise bullet points
- Do NOT add "Generated with Claude Code" or any AI attribution to the PR body
- Assign the current GitHub user as the PR assignee (`--assignee @me`)
- Base branch: `main`

## 4. Return PR URL
