/**
 * Merger for combining example structure with target values
 */

import type { ParsedEnvFile, EnvDiff, EnvLine, EnvVariable } from '../types/env.js';

export interface MergeOptions {
  newVariableValues: Map<string, string>; // User-provided values for new vars
}

/**
 * Merge example file structure with target file values
 * - Adopts structure from example
 * - Preserves values from target
 * - Uses provided values for new variables
 * - Preserves unknown variables (in target but not example) in a separate section
 */
export function mergeEnvFiles(
  example: ParsedEnvFile,
  target: ParsedEnvFile,
  diff: EnvDiff,
  options: MergeOptions
): EnvLine[] {
  const result: EnvLine[] = [];
  const usedTargetVars = new Set<string>();

  // Walk through example structure
  for (const line of example.lines) {
    if (line.type === 'comment' || line.type === 'empty') {
      result.push(line);
      continue;
    }

    // It's a variable
    const exampleVar = line;
    const targetVar = target.variables.get(exampleVar.key);

    if (targetVar) {
      // Variable exists in target - keep target value but update structure
      usedTargetVars.add(exampleVar.key);
      result.push({
        ...exampleVar,
        value: targetVar.value,
        rawValue: formatValue(targetVar.value, exampleVar.quoteStyle),
      });
    } else {
      // New variable - use provided value or example value
      const newValue = options.newVariableValues.get(exampleVar.key) ?? exampleVar.value;
      result.push({
        ...exampleVar,
        value: newValue,
        rawValue: formatValue(newValue, exampleVar.quoteStyle),
      });
    }
  }

  // Append variables from target that aren't in example (preserved unknowns)
  const unknownVars = [...target.variables.entries()].filter(
    ([key]) => !usedTargetVars.has(key) && !example.variables.has(key)
  );

  if (unknownVars.length > 0) {
    result.push({ type: 'empty' });
    result.push({
      type: 'comment',
      content: '# === Local variables (not in example) ===',
    });
    for (const [, variable] of unknownVars) {
      result.push(variable);
    }
  }

  return result;
}

/**
 * Format a value with the specified quote style
 */
function formatValue(value: string, quoteStyle: EnvVariable['quoteStyle']): string {
  switch (quoteStyle) {
    case 'double':
      return `"${escapeDoubleQuoted(value)}"`;
    case 'single':
      // Single quotes don't support escape sequences in most shells
      // If value contains single quote, fall back to double quotes
      if (value.includes("'")) {
        return `"${escapeDoubleQuoted(value)}"`;
      }
      return `'${value}'`;
    case 'backtick':
      return `\`${value}\``;
    default:
      // If value contains special characters, quote it
      if (needsQuoting(value)) {
        return `"${escapeDoubleQuoted(value)}"`;
      }
      return value;
  }
}

/**
 * Escape special characters for double-quoted strings
 */
function escapeDoubleQuoted(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Check if a value needs to be quoted
 */
function needsQuoting(value: string): boolean {
  return /[\s#"'`=]/.test(value) || value.includes('\n');
}
