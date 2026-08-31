# commit-conventions Specification

## Purpose

Keeps git history readable by requiring Conventional Commits at commit time, including commits written by a coding agent.

## Requirements

### Requirement: Commit subject follows Conventional Commits

A git commit created in this repository MUST use a Conventional Commits subject: `type` (optional `scope`) then a description, for example `feat: add task start endpoint`. Allowed types MUST include `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, and `revert`. Merge commits produced by GitHub MAY be ignored by the check.

#### Scenario: Valid feature commit is accepted

- **WHEN** a contributor creates a commit whose subject is `feat: add task start endpoint`
- **THEN** the commit is created successfully

#### Scenario: Subject without a type is rejected

- **WHEN** a contributor creates a commit whose subject is `add task start endpoint`
- **THEN** the commit is not created

#### Scenario: Unknown type is rejected

- **WHEN** a contributor creates a commit whose subject is `wip: trying things`
- **THEN** the commit is not created

### Requirement: Invalid messages are rejected at commit time

The repository MUST run the Conventional Commits check when `git commit` runs, before the commit object is written. The check MUST apply to commits created by humans and by coding agents. Skipping the check MUST NOT be part of the documented workflow.

#### Scenario: Agent commit with a valid subject succeeds

- **WHEN** a coding agent creates a commit with a valid Conventional Commits subject
- **THEN** the commit is created successfully

#### Scenario: Agent commit with a free-form subject fails

- **WHEN** a coding agent creates a commit whose subject does not match Conventional Commits
- **THEN** the commit is not created

### Requirement: Coding agents are instructed to write Conventional Commits

The repository MUST include persistent agent instructions, always in effect, that tell a coding agent to write Conventional Commit subjects when creating git commits. Those instructions MUST name the allowed types and MUST NOT tell the agent to skip git hooks.

#### Scenario: Agent has commit-format guidance

- **WHEN** a coding agent is asked to create a git commit in this repository
- **THEN** it has project instructions to use a Conventional Commits subject and to leave git hooks enabled
