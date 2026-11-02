---
"env-pull": patch
---

Security hardening: newly created env files are written with owner-only permissions (`0600`), and `--dry-run` output redacts variable values so secrets don't end up in terminal scrollback or CI logs. The published package no longer includes the agent skill files or source maps.
