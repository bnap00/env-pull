# env-pull

**Pull `.env` updates from `.env.example` — automatically after git pull.**

[![npm version](https://img.shields.io/npm/v/env-pull.svg)](https://www.npmjs.com/package/env-pull)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![skills.sh](https://skills.sh/b/bnap00/env-pull)](https://skills.sh/bnap00/env-pull)

---

## The Problem

Your teammate adds `NEW_API_KEY` to `.env.example`. You pull the latest code. Your app crashes because your local `.env` is missing the new variable.

Sound familiar?

**env-pull** solves this by intelligently syncing your environment files:

- Adopts the structure and comments from `.env.example`
- Preserves your existing secret values
- Keeps your local-only variables safe
- **Auto-syncs after `git pull`** with one command setup

---

## Quick Start

```bash
# Install globally
npm install -g env-pull

# Run in your project directory
env-pull

# Set up auto-sync after git pull
env-pull init
```

That's it. env-pull auto-detects your `.env.example` and `.env` files.

---

## Agent Skill

This repository includes an agent skill at [`skills/env-pull`](./skills/env-pull) for Claude Code, OpenCode, Codex-compatible skill loaders, and skills.sh.

Install it with the skills.sh CLI:

```bash
npx skills add bnap00/env-pull --skill env-pull
```

Or from the direct GitHub path:

```bash
npx skills add https://github.com/bnap00/env-pull/tree/main/skills/env-pull
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Auto-Sync on Pull** | Set up once with `env-pull init`, syncs automatically |
| **Interactive Wizard** | Shows a colored diff and prompts for new values |
| **Quiet Mode** | Non-interactive mode for CI/CD pipelines (`-q`) |
| **Auto-Detection** | Finds `.env.example` → `.env` pairs automatically |
| **Value Preservation** | Your existing secrets stay intact |
| **Comment Sync** | Adopts comments and structure from example file |
| **Local Var Safety** | Variables not in example are preserved separately |
| **Dry Run** | Preview changes without modifying files (`--dry-run`) |
| **Backup** | Create a backup before modifying (`--backup`) |

---

## Installation

### npm

```bash
# Global installation
npm install -g env-pull

# Or use npx (no install needed)
npx env-pull

# Or install locally in your project
npm install --save-dev env-pull
```

### pnpm

```bash
# Global installation
pnpm add -g env-pull

# Or use pnpm dlx (no install needed)
pnpm dlx env-pull

# Or install locally in your project
pnpm add -D env-pull
```

### Bun

```bash
# Global installation
bun add -g env-pull

# Or use bunx (no install needed)
bunx env-pull

# Or install locally in your project
bun add -d env-pull
```

---

## Auto-Sync on Git Pull

### Quick Setup

```bash
env-pull init
```

This creates a git hook that automatically syncs your `.env` after each `git pull` when `.env.example` has changed.

```
$ env-pull init
Created git hook: .git/hooks/post-merge

Your .env will now auto-sync after each git pull!
The hook runs only when .env.example changes.
```

### Manual Setup (Husky)

If you use Husky, add to `.husky/post-merge`:

```bash
#!/bin/sh
npx env-pull -q
```

---

## Usage

### Interactive Mode (Default)

```bash
env-pull
```

Shows a diff and prompts for any new variable values:

```
Syncing .env with .env.example

=== Environment File Diff ===

+ New variables (will be added):
  + NEW_API_KEY=your-key-here
    # API key for the new service

~ Variables not in example (will be preserved):
  ~ DEBUG_MODE=<current value kept>

= Unchanged (keeping current values):
  = DATABASE_URL
  = API_KEY

Summary:
  1 new variable(s) to add
  1 local variable(s) to preserve
  2 unchanged

Please provide values for new variables:

# API key for the new service
NEW_API_KEY: █

Apply these changes? (Y/n)
```

### Quiet Mode (CI/CD)

```bash
env-pull -q
```

Uses example values for new variables. No prompts. Perfect for automation.

### Check Mode (CI Validation)

```bash
env-pull check
```

Exits with code 1 if `.env` is missing variables from `.env.example`:

```
Environment file is out of sync!

Missing variables from .env.example:
  - NEW_API_KEY
  - RATE_LIMIT

Run "env-pull" to sync the files.
```

### Dry Run

```bash
env-pull --dry-run
```

Preview what would change without writing to disk.

### With Backup

```bash
env-pull --backup
```

Creates `.env.backup` before modifying.

---

## CLI Reference

### `env-pull [sync]`

Sync environment file with example (default command).

| Option | Description |
|--------|-------------|
| `-e, --example <file>` | Path to example file (default: auto-detect) |
| `-t, --target <file>` | Path to target file (default: auto-detect) |
| `-q, --quiet` | Non-interactive mode, use example values |
| `-d, --dry-run` | Preview changes without writing |
| `-b, --backup` | Create backup before modifying |

### `env-pull check`

Check if env file is in sync (exits 1 if not).

| Option | Description |
|--------|-------------|
| `-e, --example <file>` | Path to example file |
| `-t, --target <file>` | Path to target file |

### `env-pull init`

Set up git hook for auto-sync after `git pull`.

---

## How It Works

### Before Sync

**.env.example** (updated by teammate):
```bash
# === Database ===
DATABASE_URL=postgres://localhost/mydb

# === API ===
API_KEY=your-key
NEW_FEATURE_FLAG=false  # Added by teammate!
```

**.env** (your local file):
```bash
DATABASE_URL=postgres://prod.db.com/real_db
API_KEY=sk-real-secret-key
DEBUG_MODE=true  # Your local-only var
```

### After `env-pull`

**.env** (synced):
```bash
# === Database ===
DATABASE_URL=postgres://prod.db.com/real_db

# === API ===
API_KEY=sk-real-secret-key
NEW_FEATURE_FLAG=false

# === Local variables (not in example) ===
DEBUG_MODE=true
```

**What happened:**
- Structure and comments adopted from `.env.example`
- Your values for `DATABASE_URL` and `API_KEY` preserved
- New `NEW_FEATURE_FLAG` added with example value
- Your local `DEBUG_MODE` preserved in a separate section

---

## CI/CD Integration

### GitHub Actions

```yaml
name: CI
on: [push, pull_request]

jobs:
  check-env:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Check env sync
        run: |
          npm install -g env-pull
          env-pull check
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npx env-pull check || {
  echo "Run 'npx env-pull' to sync your .env file"
  exit 1
}
```

---

## Supported File Patterns

env-pull auto-detects these common patterns:

| Example File | Target File |
|--------------|-------------|
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

Or specify files explicitly:

```bash
env-pull --example .env.template --target .env.local
```

---

## Edge Cases Handled

- **Multiline values** — Quoted strings spanning multiple lines
- **Special characters** — Values with spaces, `#`, `=` are auto-quoted
- **Export prefix** — `export VAR=value` syntax supported
- **Inline comments** — `KEY=value # comment` preserved
- **Escaped characters** — `\n`, `\"` in quoted strings

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

```bash
# Clone the repo
git clone https://github.com/bnap00/env-pull.git

# Install dependencies
npm install    # or: pnpm install / bun install

# Build
npm run build  # or: pnpm build / bun run build

# Run locally
npm run dev    # or: pnpm dev / bun run dev
```

---

## License

MIT

---

<p align="center">
  <b>Stop env drift. Start pulling.</b>
</p>
