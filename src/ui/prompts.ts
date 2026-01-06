/**
 * Interactive prompts for user input
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import type { VariableDiff, FilePattern } from '../types/env.js';

/**
 * Prompt user for values of new variables
 */
export async function promptForNewValues(addedVariables: VariableDiff[]): Promise<Map<string, string>> {
  const values = new Map<string, string>();

  if (addedVariables.length === 0) {
    return values;
  }

  console.log(chalk.cyan('\nPlease provide values for new variables:\n'));

  for (const variable of addedVariables) {
    // Show any comments for context
    if (variable.exampleLine?.precedingComments.length) {
      for (const comment of variable.exampleLine.precedingComments) {
        console.log(chalk.gray(comment));
      }
    }

    const { value } = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message: `${chalk.bold(variable.key)}:`,
        default: variable.exampleValue || '',
      },
    ]);

    values.set(variable.key, value);
  }

  return values;
}

/**
 * Prompt user to confirm the sync operation
 */
export async function confirmSync(): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Apply these changes?',
      default: true,
    },
  ]);

  return confirmed;
}

/**
 * Prompt user to select which file pair to sync
 */
export async function selectFilePair(
  pairs: FilePattern[]
): Promise<FilePattern> {
  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: 'Multiple env file pairs detected. Select which to sync:',
      choices: pairs.map((p, i) => ({
        name: `${p.example} → ${p.target}`,
        value: i,
      })),
    },
  ]);

  return pairs[selected];
}

/**
 * Prompt user to confirm creating a new target file
 */
export async function confirmCreateTarget(targetFile: string): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `${targetFile} doesn't exist. Create it from example?`,
      default: true,
    },
  ]);

  return confirmed;
}
