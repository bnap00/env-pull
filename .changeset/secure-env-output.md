---
"env-pull": patch
---

Security hardening: on POSIX systems, newly created env files are written with owner-only permissions (`0600`); on Windows, access follows the parent directory's ACLs. `--dry-run` output redacts variable values and leaves out comments, so secrets don't end up in terminal scrollback or CI logs. The published package no longer includes the agent skill files or source maps.
