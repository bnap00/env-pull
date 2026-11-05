/**
 * Writer for serializing env lines back to file content
 */

import type { EnvLine, EnvVariable } from '../types/env.js';

export interface WriteOptions {
  /**
   * Replace non-empty values with a placeholder and drop comments, which can hold
   * commented-out secrets (for previews that may end up in logs)
   */
  redactValues?: boolean;
}

export const REDACTED_VALUE = '<redacted>';

/**
 * Serialize merged env lines back to string content
 */
export function writeEnvFile(lines: EnvLine[], options: WriteOptions = {}): string {
  const result: string[] = [];

  for (const line of lines) {
    switch (line.type) {
      case 'empty':
        result.push('');
        break;
      case 'comment':
        if (!options.redactValues) {
          result.push(line.content);
        }
        break;
      case 'variable':
        result.push(...formatVariableLine(line, options));
        break;
    }
  }

  return result.join('\n');
}

/**
 * Format a variable line including its preceding comments
 */
function formatVariableLine(variable: EnvVariable, options: WriteOptions): string[] {
  const lines: string[] = [];

  // Add preceding comments
  if (!options.redactValues) {
    lines.push(...variable.precedingComments);
  }

  // Build variable line
  let varLine = '';
  if (variable.hasExport) {
    varLine += 'export ';
  }
  const value = options.redactValues && variable.value !== '' ? REDACTED_VALUE : variable.rawValue;
  varLine += `${variable.key}=${value}`;
  if (variable.inlineComment && !options.redactValues) {
    varLine += ` ${variable.inlineComment}`;
  }
  lines.push(varLine);

  return lines;
}
