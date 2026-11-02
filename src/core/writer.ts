/**
 * Writer for serializing env lines back to file content
 */

import type { EnvLine, EnvVariable } from '../types/env.js';

export interface WriteOptions {
  /** Replace non-empty values with a placeholder (for previews that may end up in logs) */
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
        result.push(line.content);
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
  for (const comment of variable.precedingComments) {
    lines.push(comment);
  }

  // Build variable line
  let varLine = '';
  if (variable.hasExport) {
    varLine += 'export ';
  }
  const value = options.redactValues && variable.value !== '' ? REDACTED_VALUE : variable.rawValue;
  varLine += `${variable.key}=${value}`;
  if (variable.inlineComment) {
    varLine += ` ${variable.inlineComment}`;
  }
  lines.push(varLine);

  return lines;
}
