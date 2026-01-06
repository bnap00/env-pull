/**
 * Writer for serializing env lines back to file content
 */

import type { EnvLine, EnvVariable } from '../types/env.js';

/**
 * Serialize merged env lines back to string content
 */
export function writeEnvFile(lines: EnvLine[]): string {
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
        result.push(...formatVariableLine(line));
        break;
    }
  }

  return result.join('\n');
}

/**
 * Format a variable line including its preceding comments
 */
function formatVariableLine(variable: EnvVariable): string[] {
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
  varLine += `${variable.key}=${variable.rawValue}`;
  if (variable.inlineComment) {
    varLine += ` ${variable.inlineComment}`;
  }
  lines.push(varLine);

  return lines;
}
