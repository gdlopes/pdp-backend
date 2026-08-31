---
name: open-pull-request
description: >-
  Commits uncommitted work with Conventional Commits, then opens a GitHub pull
  request against main using .github/pull_request_template.md, with the
  description in English. Use when the user asks to open, create, or submit a
  PR, or when changes are done and they want a pull request.
---

# Open Pull Request

Create a GitHub PR with `gh`. Do not use TodoWrite or Task. Return the PR URL when done.

## Hard rules

- You must use the `.github/pull_request_template.md`.
- The description must be in English.
- The PR should use branch `main` as base branch.
- If there are uncommitted changes, commit them before opening the PR. Do not stop to ask who should commit.
- Group related files into the same commit. Make as many commits as needed.
- Commit messages MUST follow Conventional Commits (see `.cursor/rules/conventional-commits.mdc`).
- If the current branch is `main`, warn me and stop. The PR source must always be a different branch.

## Workflow

### 1. Commit uncommitted work

Run these in parallel first:

- `git status`
- `git diff` and `git diff --staged`
- `git log -8 --oneline` (match recent message style)

**Clean tree:** skip to step 2.

**Dirty tree** (unstaged, staged, or untracked files that belong in the PR): commit before anything else. Do not stash, and do not open the PR with a dirty tree.

#### Grouping

Inspect the diffs and partition files into logical groups. Related files go in the same commit; unrelated concerns get separate commits. Prefer a split over one mixed commit.

Group together, for example:

- A feature or fix and its tests
- `package.json` with `package-lock.json`
- An OpenSpec change's proposal, design, specs, and tasks
- A workflow file with the docs that describe it

Do not mix unrelated concerns (e.g. CI config with an unrelated API change).

Never commit secrets (`.env`, credentials, keys). Warn and leave those uncommitted.

#### Each commit

1. Stage only that group's files (`git add` paths; never `git add -i`).
2. Commit with a HEREDOC. Do not pass `--no-verify` or `--no-gpg-sign`. Never update git config.

```bash
git commit -m "$(cat <<'EOF'
type(optional-scope): summary

EOF
)"
```

Subject rules:

- Format: `type(optional-scope): summary`
- English, imperative mood (`add`, not `added` or `adds`)
- Around 72 characters; no trailing period
- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Body optional, separated by a blank line; focus on why when it helps

Examples: `feat: add task start endpoint`, `fix(users): return 404 when missing`, `ci: run e2e on pull requests`.

If a hook rejects a commit, fix the issue and create a **new** commit. Do not amend unless the user asked and the amend safety conditions in the repo commit rules all hold.

After the last commit, `git status` should be clean (except leftover secrets you warned about). Then continue.

### 2. Gather git state

Run these in parallel:

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
