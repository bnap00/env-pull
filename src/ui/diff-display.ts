/**
 * Colored diff display for terminal output
 */

import chalk from 'chalk';
import type { EnvDiff } from '../types/env.js';

/**
 * Display a formatted diff to the console
 */
export function displayDiff(diff: EnvDiff): void {
  console.log(chalk.bold('\n=== Environment File Diff ===\n'));

  // Group by diff type
  const added = diff.variableDiffs.filter((d) => d.diffType === 'added');
  const removed = diff.variableDiffs.filter((d) => d.diffType === 'removed');
  const unchanged = diff.variableDiffs.filter((d) => d.diffType === 'unchanged');

  // Show added variables
  if (added.length > 0) {
    console.log(chalk.green.bold('+ New variables (will be added):'));
    for (const v of added) {
      const defaultValue = v.exampleValue ? maskSensitive(v.key, v.exampleValue) : '<empty>';
      console.log(chalk.green(`  + ${v.key}=${defaultValue}`));
      if (v.exampleLine?.precedingComments.length) {
        for (const comment of v.exampleLine.precedingComments) {
          console.log(chalk.gray(`    ${comment}`));
        }
      }
    }
    console.log();
  }

  // Show removed variables (will be preserved)
  if (removed.length > 0) {
    console.log(chalk.yellow.bold('~ Variables not in example (will be preserved):'));
    for (const v of removed) {
      console.log(chalk.yellow(`  ~ ${v.key}=<current value kept>`));
    }
    console.log();
  }

  // Show unchanged variables
  if (unchanged.length > 0) {
    console.log(chalk.gray.bold('= Unchanged (keeping current values):'));
    for (const v of unchanged) {
      console.log(chalk.gray(`  = ${v.key}`));
    }
    console.log();
  }

  // Summary
  console.log(chalk.cyan('Summary:'));
  console.log(chalk.green(`  ${diff.summary.added} new variable(s) to add`));
  console.log(chalk.yellow(`  ${diff.summary.removed} local variable(s) to preserve`));
  console.log(chalk.gray(`  ${diff.summary.unchanged} unchanged`));
}

/**
 * Mask sensitive values for display
 */
function maskSensitive(key: string, value: string): string {
  // Keys that typically contain secrets
  const sensitivePatterns = [
    /key/i,
    /secret/i,
    /password/i,
    /token/i,
    /auth/i,
    /credential/i,
    /private/i,
  ];

  const isSensitive = sensitivePatterns.some((pattern) => pattern.test(key));

  if (isSensitive && value.length > 0) {
    if (value.length <= 4) {
      return '****';
    }
    return value.slice(0, 2) + '****' + value.slice(-2);
  }

  // Also mask long values that look like keys/tokens
  if (value.length > 20 && /^[a-zA-Z0-9_-]+$/.test(value)) {
    return value.slice(0, 4) + '****' + value.slice(-4);
  }

  return value;
}
