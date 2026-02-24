---
name: commit
description: Stage and commit changes using conventional commit format
user_invocable: true
---

# Commit

## 1. Gather context (parallel)
- `git status` (no `-uall`)
- `git diff` (staged + unstaged)
- `git log --oneline -10`

## 2. Stage files
- Add only related files (never `git add -A`). Skip secrets/credentials.

## 3. Commit
Format: `type: concise message`
- Do NOT add `Co-Authored-By` or any AI attribution to the commit message

Types: `fix`, `feat`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`, `ci`, `build`
