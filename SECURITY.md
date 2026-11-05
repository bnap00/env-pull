# Security Policy

env-pull reads and writes files that hold secrets, so security reports are taken seriously.

## Supported versions

Only the latest release on npm receives security fixes.

## Reporting a vulnerability

Please **do not** open a public issue.

Report it privately through GitHub: [Report a vulnerability](https://github.com/bnap00/env-pull/security/advisories/new) (Security tab → "Report a vulnerability").

Include the version, steps to reproduce, and the impact you expect. You should get a response within 7 days. Once a fix is released, the advisory will be published with credit to you unless you prefer otherwise.

## Release integrity

Releases are published from GitHub Actions using npm trusted publishing with [provenance](https://docs.npmjs.com/generating-provenance-statements). The npm package page shows a "Provenance" section linking each version to the workflow run and commit that built it.

To check a specific version from the command line, install it into an empty project (not this repository's checkout, where the audit would cover env-pull's own dependencies instead) and verify it:

```bash
mkdir env-pull-verify && cd env-pull-verify
npm init -y
npm install env-pull@<version>
npm audit signatures
```

`npm audit signatures` checks the registry signatures and provenance attestations of everything installed there; the output should report verified attestations. You can also confirm that the version has an attestation with `npm view env-pull@<version> dist.attestations`.
