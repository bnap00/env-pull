# env-pull guide

`env-pull` pulls updates from `.env.example`-style files into local `.env`-style files.

GitHub: https://github.com/bnap00/env-pull
npm package: `env-pull`

## What env-pull does

`env-pull`:

- Reads an example/template file such as `.env.example`, `.env.sample`, `.env.template`, `.env.local.example`, `.env.development.example`, `.env.production.example`, `.dev.vars.example`, `example.env`, or `sample.env`.
- Updates the matching target file such as `.env`, `.env.local`, `.env.development`, `.env.production`, or `.dev.vars`.
- Preserves current target values for variables already present, which protects existing local secrets.
- Adds new variables from the example/template file.
- Preserves target-only local variables in a separate local section.
- Copies comments and structure from the example/template file.

## Installation

If `env-pull` is not available, install it using the package manager appropriate for the project or machine.

### Global install

```bash
npm install -g env-pull
# or
pnpm add -g env-pull
# or
bun add -g env-pull
```

### One-off execution

```bash
npx env-pull
# or
pnpm dlx env-pull
# or
bunx env-pull
```

### Project dev dependency

```bash
npm install --save-dev env-pull
# or
pnpm add -D env-pull
# or
bun add -d env-pull
```

On the original author's machine, the command may also be available at:

```bash
/Users/bnap/.bun/bin/env-pull
```

Do not rely on that path for portable usage in other environments.

## Safety rules for agents

- Never print full `.env` contents or secret values in chat, logs, PR comments, or summaries.
- Prefer `env-pull check` or `env-pull --dry-run` before changing env files.
- Use `--backup` before modifying a real local env file unless the user explicitly opts out.
- Do not run `env-pull init` unless the user explicitly asks to install the git hook. It modifies `.git/hooks/post-merge`.
- In non-interactive/background agent runs, use `-q` only when it is acceptable to use example placeholder/default values for new variables.
- If new variables need real secret values, stop and ask the user for the values or list only the variable names that need filling.
- If a command output includes values, redact values before summarizing.

## Common workflows

### Check whether env files are in sync

Run from the project root:

```bash
env-pull check
```

With explicit files:

```bash
env-pull check --example .env.example --target .env
```

Exit code `1` means the target is missing variables from the example/template.

### Preview sync without writing

```bash
env-pull --dry-run
```

Explicit files:

```bash
env-pull --example .env.example --target .env --dry-run
```

### Safely sync interactively

Use when a human is present and new variables may need real values:

```bash
env-pull --backup
```

### Safely sync non-interactively

Use for automation only when example/default values are acceptable for new variables:

```bash
env-pull -q --backup
```

Explicit files:

```bash
env-pull --example .env.example --target .env -q --backup
```

### Set up auto-sync after git pull

Only when the user explicitly requests it:

```bash
env-pull init
```

This creates or updates `.git/hooks/post-merge` so `.env` syncs after `git pull` when `.env.example` changes.

For Husky projects, suggest adding this to `.husky/post-merge` instead:

```bash
#!/bin/sh
npx env-pull -q
```

## CLI reference

```bash
env-pull [sync] [options]
env-pull check [options]
env-pull init
```

Sync options:

- `-e, --example <file>`: example/template file path.
- `-t, --target <file>`: target env file path.
- `-q, --quiet`: non-interactive; uses example values for new variables.
- `-d, --dry-run`: preview only.
- `-b, --backup`: create target backup before writing.

Check options:

- `-e, --example <file>`: example/template file path.
- `-t, --target <file>`: target env file path.

## Supported file patterns

Auto-detected example/target pairs include:

| Example file | Target file |
| --- | --- |
| `.env.example` | `.env` |
| `.env.sample` | `.env` |
| `.env.template` | `.env` |
| `.env.example` | `.env.local` |
| `.env.local.example` | `.env.local` |
| `.env.development.example` | `.env.development` |
| `.env.production.example` | `.env.production` |
| `.dev.vars.example` | `.dev.vars` |
| `example.env` | `.env` |
| `sample.env` | `.env` |

When auto-detection is ambiguous or fails, pass explicit paths:

```bash
env-pull --example .env.template --target .env.local
```

## Output guidance for agents

After running `env-pull`, summarize only:

- Command used.
- Whether files were already synced, changed, or need attention.
- Names of missing/new variables if available.
- Any follow-up needed from the user.

Do not include secret values.
