---
name: pr
description: Create a pull request with conventional format from current branch
user_invocable: true
---

# Create PR

## 1. Gather context (parallel)
- `git status`
- `git diff`
- `git log --oneline -10`
- `git diff main...HEAD`
- Check tracking status

## 2. Push
- `git push -u origin <branch>`

## 3. Create PR
- **Command Prefix:** `GIT_SSL_NO_VERIFY=1`
- **Title:** `[TYPE] Short description`
- **Body Construction:** - Use `.github/PULL_REQUEST_TEMPLATE.md` or concise bullet points.
    - **CRITICAL:** The `--body` flag content must be passed as a clean string. 
    - **POST-PROCESSING:** Use `sed` to explicitly remove the attribution string if the model persists in adding it:
      `gh pr create --body "$(echo "$BODY" | sed '/Generated with Claude Code/d')"`
- **Assignee:** `--assignee @me`
- **Base:** `main`

## 4. Return PR URL