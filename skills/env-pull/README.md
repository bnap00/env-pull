# env-pull skill

Agent skill for using [`env-pull`](https://github.com/bnap00/env-pull) safely.

## Install with skills.sh CLI

Once this repository is indexed by skills.sh, install with:

```bash
npx skills add bnap00/env-pull --skill env-pull
```

Or from the direct GitHub path:

```bash
npx skills add https://github.com/bnap00/env-pull/tree/main/skills/env-pull
```

## Manual install

Copy this directory to an agent skill directory, for example:

```bash
mkdir -p ~/.agents/skills
cp -R skills/env-pull ~/.agents/skills/env-pull
```

For OpenCode:

```bash
mkdir -p ~/.config/opencode/skills
cp -R skills/env-pull ~/.config/opencode/skills/env-pull
```

For Claude Code:

```bash
mkdir -p ~/.claude/skills
cp -R skills/env-pull ~/.claude/skills/env-pull
```
