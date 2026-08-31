---
name: open-pull-request
description: >-
  Opens a GitHub pull request against main using .github/pull_request_template.md,
  with the description in English. Use when the user asks to open, create, or
  submit a PR, or when changes are done and they want a pull request.
---

# Open Pull Request

Create a GitHub PR with `gh`. Do not use TodoWrite or Task. Return the PR URL when done.

## Hard rules

- You must use the `.github/pull_request_template.md`.
- The description must be in English.
- The PR should use branch `main` as base branch.
- If there is uncommitted changes you should alert me to decide who will commit those changes.
- If the current branch is `main`, warn me and stop. The PR source must always be a different branch.

## Workflow

### 1. Stop on uncommitted work

Run `git status` first.

If there are uncommitted or unstaged changes (including untracked files that belong in the PR):

1. **Stop.** Do not commit, stash, push, or create the PR.
2. Alert the user that uncommitted changes exist and list them.
3. Ask who should commit those changes: the user, or you.
4. Wait for their decision. Resume this workflow only after the working tree is clean (or they explicitly say the leftover files must not be in the PR).

Do not invent a commit. Do not proceed "for now" with a dirty tree.

### 2. Gather git state

Once the tree is clean, run these in parallel:

- `git status`
- `git diff`
- `git branch -vv` (or equivalent) to see whether the current branch tracks a remote and is up to date
- `git log --oneline main..HEAD`
- `git diff main...HEAD`

### 3. Preconditions

- **On `main`:** **Stop.** Do not create a branch, push, or open the PR. Warn the user that they are on `main` and that the PR source must always be a different branch. Wait for them to switch or create a feature branch, then resume.
- **Nothing to open:** if the current branch has no commits ahead of `main`, tell the user and stop.
- **PR already exists** for this branch (`gh pr view`): return that URL instead of creating a duplicate.

### 4. Push

If the branch is not on the remote, or is behind the remote in a way that needs a normal push:

```bash
git push -u origin HEAD
```

Never update git config. Never force-push to `main`/`master`. Never skip hooks.

### 5. Fill the template

Read `.github/pull_request_template.md` and use it as the PR body. Keep every heading and HTML comment. Fill the placeholders in **English**:

- **What changed?** — 1–3 bullets of what this PR does (feature, fix, refactor, infra, etc.)
- **Learnings** — what was discovered or practiced; use `- N/A` only if nothing applies
- **Evidence it works** — tests run, endpoints hit, or other proof; note screenshots if the user provided them
- **Checklist** — mark items that are actually true (`[x]`). Do not check boxes you cannot verify.

PR **title** is also English, concise, and matches the repo's recent commit/PR style (`git log` / existing PRs).

### 6. Create the PR

```bash
gh pr create --base main --title "the pr title" --body "$(cat <<'EOF'
<body copied from the filled template>
EOF
)"
```

Pass `--base main` every time. After it succeeds, return the PR URL to the user.
