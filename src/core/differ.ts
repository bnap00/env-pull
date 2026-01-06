/**
 * Diff engine for comparing env files
 */

import type { ParsedEnvFile, EnvDiff, VariableDiff } from '../types/env.js';

/**
 * Compare example and target env files to produce a structured diff
 */
export function diffEnvFiles(example: ParsedEnvFile, target: ParsedEnvFile): EnvDiff {
  const variableDiffs: VariableDiff[] = [];

  const exampleKeys = new Set(example.variables.keys());
  const targetKeys = new Set(target.variables.keys());

  // Find added variables (in example but not in target)
  for (const key of exampleKeys) {
    if (!targetKeys.has(key)) {
      const exampleVar = example.variables.get(key)!;
      variableDiffs.push({
        key,
        diffType: 'added',
        exampleValue: exampleVar.value,
        exampleLine: exampleVar,
      });
    }
  }

  // Find removed variables (in target but not in example)
  // These will be preserved in a separate section
  for (const key of targetKeys) {
    if (!exampleKeys.has(key)) {
      const targetVar = target.variables.get(key)!;
      variableDiffs.push({
        key,
        diffType: 'removed',
        currentValue: targetVar.value,
        currentLine: targetVar,
      });
    }
  }

  // Find unchanged variables (exist in both)
  for (const key of exampleKeys) {
    if (targetKeys.has(key)) {
      const exampleVar = example.variables.get(key)!;
      const targetVar = target.variables.get(key)!;

      variableDiffs.push({
        key,
        diffType: 'unchanged',
        exampleValue: exampleVar.value,
        currentValue: targetVar.value,
        exampleLine: exampleVar,
        currentLine: targetVar,
      });
    }
  }

  const summary = {
    added: variableDiffs.filter((d) => d.diffType === 'added').length,
    removed: variableDiffs.filter((d) => d.diffType === 'removed').length,
    unchanged: variableDiffs.filter((d) => d.diffType === 'unchanged').length,
  };

  return {
    variableDiffs,
    hasChanges: summary.added > 0 || summary.removed > 0,
    summary,
  };
}
