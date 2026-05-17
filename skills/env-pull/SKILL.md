---
name: env-pull
description: Use this skill whenever a task involves installing, checking, syncing, repairing, or auditing .env files against .env.example, .env.sample, .env.template, .env.local.example, or .dev.vars.example files. Trigger for env-pull, environment variable drift, missing env vars after git pull, agent setup for env syncing, or requests to keep local environment files in sync safely. Prefer env-pull over manual .env editing unless custom restructuring is explicitly requested.
---

# env-pull

Use `env-pull` to keep local environment files synchronized with example/template files while preserving existing secret values.

For command details, installation options, safety rules, supported file patterns, and response guidance, read:

- `references/env-pull-guide.md`

Load that reference file before running `env-pull`, installing it, or changing any `.env`-style file.

## Fast path

1. Check whether `env-pull` is available:

   ```bash
   command -v env-pull || npm install -g env-pull
   ```

2. Inspect drift without exposing secrets:

   ```bash
   env-pull check
   ```

3. Preview changes before writing:

   ```bash
   env-pull --dry-run
   ```

4. Sync safely when appropriate:

   ```bash
   env-pull --backup
   ```

For non-interactive agents, use quiet mode only when example/default values are acceptable for newly added variables:

```bash
env-pull -q --backup
```

Do not print `.env` contents or secret values in chat.
