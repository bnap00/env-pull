/**
 * CLI interface for env-pull
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';

import { parseEnvFile } from './core/parser.js';
import { diffEnvFiles } from './core/differ.js';
import { mergeEnvFiles } from './core/merger.js';
import { writeEnvFile } from './core/writer.js';
import { detectFilePairs, fileExists } from './utils/file-detection.js';
import { displayDiff } from './ui/diff-display.js';
import { promptForNewValues, confirmSync, selectFilePair, confirmCreateTarget } from './ui/prompts.js';
import type { SyncConfig } from './types/env.js';

// Read version from package.json
const require = createRequire(import.meta.url);
const { version: VERSION } = require('../package.json');

export function createCli(): Command {
  const program = new Command();

  program
    .name('env-pull')
    .description('Pull .env updates from .env.example automatically')
    .version(VERSION);

  // Default sync command
  program
    .command('sync', { isDefault: true })
    .description('Sync environment file with example/template')
    .option('-e, --example <file>', 'Path to example file (e.g., .env.example)')
    .option('-t, --target <file>', 'Path to target file (e.g., .env)')
    .option('-q, --quiet', 'Non-interactive mode, use example values for new variables', false)
    .option('-d, --dry-run', 'Preview changes without writing to file', false)
    .option('-b, --backup', 'Create a backup of target file before modifying', false)
    .action(async (options) => {
      try {
        await runSync({
          exampleFile: options.example,
          targetFile: options.target,
          quiet: options.quiet,
          dryRun: options.dryRun,
          backup: options.backup,
        });
      } catch (error) {
        handleError(error);
      }
    });

  // Check command for CI
  program
    .command('check')
    .description('Check if env file is in sync with example (exit 1 if not)')
    .option('-e, --example <file>', 'Path to example file')
    .option('-t, --target <file>', 'Path to target file')
    .action(async (options) => {
      try {
        await runCheck({
          exampleFile: options.example,
          targetFile: options.target,
          quiet: true,
          dryRun: true,
          backup: false,
        });
      } catch (error) {
        handleError(error);
      }
    });

  // Init command to set up git hooks
  program
    .command('init')
    .description('Set up git hook to auto-sync after git pull')
    .action(async () => {
      try {
        await runInit();
      } catch (error) {
        handleError(error);
      }
    });

  return program;
}

/**
 * Handle errors gracefully
 */
function handleError(error: unknown): never {
  if (error instanceof Error) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
  } else {
    console.error(chalk.red('An unexpected error occurred'));
  }
  process.exit(1);
}

/**
 * Safely read a file with error handling
 */
function safeReadFile(filePath: string, fileName: string): string {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        throw new Error(`File not found: ${fileName}`);
      } else if (code === 'EACCES') {
        throw new Error(`Permission denied reading: ${fileName}`);
      } else if (code === 'EISDIR') {
        throw new Error(`Path is a directory, not a file: ${fileName}`);
      }
    }
    throw new Error(`Failed to read file: ${fileName}`);
  }
}

/**
 * Safely write a file with error handling
 */
function safeWriteFile(filePath: string, content: string, fileName: string): void {
  try {
    writeFileSync(filePath, content);
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'EACCES') {
        throw new Error(`Permission denied writing: ${fileName}`);
      } else if (code === 'ENOSPC') {
        throw new Error(`No space left on device writing: ${fileName}`);
      } else if (code === 'EROFS') {
        throw new Error(`Read-only file system, cannot write: ${fileName}`);
      }
    }
    throw new Error(`Failed to write file: ${fileName}`);
  }
}

/**
 * Safely copy a file with error handling
 */
function safeCopyFile(src: string, dest: string, srcName: string): void {
  try {
    copyFileSync(src, dest);
  } catch (error) {
    throw new Error(`Failed to create backup of: ${srcName}`);
  }
}

/**
 * Set up git hook for auto-sync after pull
 */
async function runInit(): Promise<void> {
  const cwd = process.cwd();
  const gitDir = join(cwd, '.git');
  const hooksDir = join(gitDir, 'hooks');
  const hookPath = join(hooksDir, 'post-merge');

  // Check if in a git repository
  if (!existsSync(gitDir)) {
    throw new Error('Not a git repository. Run "git init" first.');
  }

  // Create hooks directory if it doesn't exist
  if (!existsSync(hooksDir)) {
    mkdirSync(hooksDir, { recursive: true });
  }

  // Check if hook already exists
  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, 'utf-8');
    if (existing.includes('env-pull')) {
      console.log(chalk.yellow('Git hook already configured for env-pull.'));
      return;
    }
    // Append to existing hook
    const newContent = existing.trimEnd() + '\n\n' + getHookScript();
    writeFileSync(hookPath, newContent);
    console.log(chalk.green('Added env-pull to existing post-merge hook.'));
  } else {
    // Create new hook
    writeFileSync(hookPath, getHookScript());
    console.log(chalk.green('Created git hook: .git/hooks/post-merge'));
  }

  // Make hook executable
  chmodSync(hookPath, '755');

  console.log(chalk.cyan('\nYour .env will now auto-sync after each git pull!'));
  console.log(chalk.gray('The hook runs only when .env.example changes.\n'));
}

/**
 * Get the post-merge hook script content
 */
function getHookScript(): string {
  return `#!/bin/sh
# env-pull: Auto-sync .env after git pull
# https://github.com/bnap00/env-pull

# Check if .env.example (or similar) was modified in the merge
changed_files=$(git diff-tree -r --name-only ORIG_HEAD HEAD 2>/dev/null)

if echo "$changed_files" | grep -qE '\\.env\\.example$|\\.env\\.sample$|\\.env\\.template$|\\.dev\\.vars\\.example$'; then
  echo "env-pull: Environment example file changed, syncing..."
  npx env-pull -q
fi
`;
}

async function runSync(config: Partial<SyncConfig>): Promise<void> {
  const cwd = process.cwd();

  // Auto-detect files if not specified
  let exampleFile = config.exampleFile;
  let targetFile = config.targetFile;

  if (!exampleFile || !targetFile) {
    const detected = detectFilePairs(cwd);

    if (detected.length === 0) {
      console.error(chalk.red('No env file pairs detected.'));
      console.error(chalk.gray('Please specify --example and --target options.'));
      console.error(chalk.gray('Example: env-pull --example .env.example --target .env'));
      process.exit(1);
    }

    if (detected.length === 1 || config.quiet) {
      exampleFile = exampleFile || detected[0].example;
      targetFile = targetFile || detected[0].target;
    } else {
      // Interactive selection
      const selected = await selectFilePair(detected);
      exampleFile = exampleFile || selected.example;
      targetFile = targetFile || selected.target;
    }
  }

  const examplePath = resolve(cwd, exampleFile);
  const targetPath = resolve(cwd, targetFile);

  // Check example file exists
  if (!fileExists(examplePath)) {
    throw new Error(`Example file not found: ${exampleFile}`);
  }

  console.log(chalk.cyan(`\nSyncing ${targetFile} with ${exampleFile}\n`));

  // Read and parse example file
  const exampleContent = safeReadFile(examplePath, exampleFile);
  const exampleParsed = parseEnvFile(exampleContent, examplePath);

  // Check if target exists
  const targetExists = fileExists(targetPath);

  if (!targetExists) {
    // Target doesn't exist - create from example
    if (!config.quiet) {
      const confirmed = await confirmCreateTarget(targetFile);
      if (!confirmed) {
        console.log(chalk.yellow('Aborted.'));
        process.exit(0);
      }
    }

    // Prompt for all variable values
    const allVariables = [...exampleParsed.variables.entries()].map(([key, v]) => ({
      key,
      diffType: 'added' as const,
      exampleValue: v.value,
      exampleLine: v,
    }));

    let newValues = new Map<string, string>();
    if (!config.quiet) {
      newValues = await promptForNewValues(allVariables);
    }

    // Create the file
    const merged = mergeEnvFiles(
      exampleParsed,
      { lines: [], variables: new Map(), filePath: targetPath },
      { variableDiffs: allVariables, hasChanges: true, summary: { added: allVariables.length, removed: 0, unchanged: 0 } },
      { newVariableValues: newValues }
    );

    const output = writeEnvFile(merged);

    if (config.dryRun) {
      console.log(chalk.yellow('\n[Dry run] Would create file with content:\n'));
      console.log(output);
    } else {
      safeWriteFile(targetPath, output + '\n', targetFile);
      console.log(chalk.green(`\nCreated ${targetFile}`));
    }

    return;
  }

  // Read and parse target file
  const targetContent = safeReadFile(targetPath, targetFile);
  const targetParsed = parseEnvFile(targetContent, targetPath);

  // Calculate diff
  const diff = diffEnvFiles(exampleParsed, targetParsed);

  if (!diff.hasChanges) {
    console.log(chalk.green('Environment file is already in sync!'));
    return;
  }

  // Display diff
  displayDiff(diff);

  // Get values for new variables
  const addedVariables = diff.variableDiffs.filter((v) => v.diffType === 'added');
  let newValues = new Map<string, string>();

  if (addedVariables.length > 0) {
    if (config.quiet) {
      // Use example values
      for (const v of addedVariables) {
        newValues.set(v.key, v.exampleValue || '');
      }
    } else {
      newValues = await promptForNewValues(addedVariables);
    }
  }

  // Confirm before writing
  if (!config.quiet && !config.dryRun) {
    const confirmed = await confirmSync();
    if (!confirmed) {
      console.log(chalk.yellow('Aborted.'));
      process.exit(0);
    }
  }

  // Merge files
  const merged = mergeEnvFiles(exampleParsed, targetParsed, diff, { newVariableValues: newValues });
  const output = writeEnvFile(merged);

  if (config.dryRun) {
    console.log(chalk.yellow('\n[Dry run] Would write:\n'));
    console.log(output);
  } else {
    // Create backup if requested
    if (config.backup) {
      const backupPath = targetPath + '.backup';
      safeCopyFile(targetPath, backupPath, targetFile);
      console.log(chalk.gray(`Backup created: ${targetFile}.backup`));
    }

    safeWriteFile(targetPath, output + '\n', targetFile);
    console.log(chalk.green(`\nSuccessfully synced ${targetFile}`));
  }
}

async function runCheck(config: Partial<SyncConfig>): Promise<void> {
  const cwd = process.cwd();

  // Auto-detect files if not specified
  let exampleFile = config.exampleFile;
  let targetFile = config.targetFile;

  if (!exampleFile || !targetFile) {
    const detected = detectFilePairs(cwd);

    if (detected.length === 0) {
      throw new Error('No env file pairs detected.');
    }

    exampleFile = exampleFile || detected[0].example;
    targetFile = targetFile || detected[0].target;
  }

  const examplePath = resolve(cwd, exampleFile);
  const targetPath = resolve(cwd, targetFile);

  // Check both files exist
  if (!fileExists(examplePath)) {
    throw new Error(`Example file not found: ${exampleFile}`);
  }

  if (!fileExists(targetPath)) {
    console.error(chalk.red(`Target file not found: ${targetFile}`));
    console.error(chalk.gray('Run "env-pull" to create it from the example.'));
    process.exit(1);
  }

  // Parse files
  const exampleContent = safeReadFile(examplePath, exampleFile);
  const targetContent = safeReadFile(targetPath, targetFile);
  const exampleParsed = parseEnvFile(exampleContent, examplePath);
  const targetParsed = parseEnvFile(targetContent, targetPath);

  // Calculate diff
  const diff = diffEnvFiles(exampleParsed, targetParsed);

  // Only check for missing variables (added from example)
  const missingVars = diff.variableDiffs.filter((v) => v.diffType === 'added');

  if (missingVars.length > 0) {
    console.log(chalk.red(`Environment file is out of sync!`));
    console.log(chalk.yellow(`\nMissing variables from ${exampleFile}:`));
    for (const v of missingVars) {
      console.log(chalk.red(`  - ${v.key}`));
    }
    console.log(chalk.gray(`\nRun "env-pull" to sync the files.`));
    process.exit(1);
  }

  console.log(chalk.green('Environment file is in sync!'));
}
