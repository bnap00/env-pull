# Security Policy

env-pull reads and writes files that hold secrets, so security reports are taken seriously.

## Supported versions

Only the latest release on npm receives security fixes.

## Reporting a vulnerability

Please **do not** open a public issue.

Report it privately through GitHub: [Report a vulnerability](https://github.com/bnap00/env-pull/security/advisories/new) (Security tab → "Report a vulnerability").

Include the version, steps to reproduce, and the impact you expect. You should get a response within 7 days. Once a fix is released, the advisory will be published with credit to you unless you prefer otherwise.

## Release integrity

Releases are published from GitHub Actions using npm trusted publishing with [provenance](https://docs.npmjs.com/generating-provenance-statements). You can check a downloaded package with:

```bash
npm audit signatures
```
