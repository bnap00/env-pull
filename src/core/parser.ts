/**
 * Parser for .env files that preserves structure including comments
 */

import type { EnvLine, EnvVariable, ParsedEnvFile } from '../types/env.js';

/**
 * Parse an env file content into a structured representation
 */
export function parseEnvFile(content: string, filePath: string): ParsedEnvFile {
  const lines: EnvLine[] = [];
  const variables = new Map<string, EnvVariable>();
  const rawLines = content.split(/\r?\n/);

  let pendingComments: string[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Empty line
    if (trimmed === '') {
      // Flush pending comments as standalone
      for (const comment of pendingComments) {
        lines.push({ type: 'comment', content: comment });
      }
      pendingComments = [];
      lines.push({ type: 'empty' });
      i++;
      continue;
    }

    // Comment line
    if (trimmed.startsWith('#')) {
      pendingComments.push(trimmed);
      i++;
      continue;
    }

    // Try to parse as variable
    const varResult = parseVariableLine(rawLines, i);
    if (varResult) {
      const envVar: EnvVariable = {
        type: 'variable',
        ...varResult.variable,
        precedingComments: pendingComments,
      };
      pendingComments = [];
      lines.push(envVar);
      variables.set(envVar.key, envVar);
      i = varResult.nextLine;
      continue;
    }

    // Unrecognized line - treat as comment
    lines.push({ type: 'comment', content: `# ${line}` });
    i++;
  }

  // Flush remaining comments at end of file
  for (const comment of pendingComments) {
    lines.push({ type: 'comment', content: comment });
  }

  return { lines, variables, filePath };
}

/**
 * Parse a variable line, handling multiline values in quotes
 */
function parseVariableLine(
  lines: string[],
  startIndex: number
): { variable: Omit<EnvVariable, 'type' | 'precedingComments'>; nextLine: number } | null {
  const line = lines[startIndex];
  const hasExport = line.trimStart().startsWith('export ');
  const normalizedLine = hasExport ? line.replace(/^(\s*)export\s+/, '$1') : line;

  // Match variable assignment: KEY=value
  const match = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/.exec(normalizedLine.trim());
  if (!match) return null;

  const key = match[1];
  let rawValue = match[2];
  let nextLine = startIndex + 1;

  // Check for multiline quoted values
  const firstChar = rawValue.trim()[0];
  if (firstChar === '"' || firstChar === "'" || firstChar === '`') {
    const result = extractQuotedValue(lines, startIndex, rawValue, firstChar);
    rawValue = result.value;
    nextLine = result.nextLine;
  }

  // Parse the value to extract actual value, quote style, and inline comment
  const { value, quoteStyle, inlineComment } = parseValue(rawValue);

  return {
    variable: { key, value, rawValue, quoteStyle, hasExport, inlineComment },
    nextLine,
  };
}

/**
 * Extract a multiline quoted value
 */
function extractQuotedValue(
  lines: string[],
  startLine: number,
  initialValue: string,
  quoteChar: string
): { value: string; nextLine: number } {
  let value = initialValue;
  let lineIndex = startLine;

  // Count unescaped quotes to check if value is complete
  const countQuotes = (s: string, q: string): number => {
    let count = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === q && (i === 0 || s[i - 1] !== '\\')) {
        count++;
      }
    }
    return count;
  };

  // Continue reading lines until we find the closing quote
  while (countQuotes(value, quoteChar) < 2 && lineIndex < lines.length - 1) {
    lineIndex++;
    value += '\n' + lines[lineIndex];
  }

  return { value, nextLine: lineIndex + 1 };
}

/**
 * Parse a raw value to extract the actual value, quote style, and inline comment
 */
function parseValue(rawValue: string): {
  value: string;
  quoteStyle: 'single' | 'double' | 'backtick' | 'none';
  inlineComment?: string;
} {
  const trimmed = rawValue.trim();

  if (trimmed === '') {
    return { value: '', quoteStyle: 'none' };
  }

  let quoteStyle: 'single' | 'double' | 'backtick' | 'none' = 'none';
  let value = trimmed;
  let inlineComment: string | undefined;

  // Handle quoted values
  if (trimmed.startsWith('"')) {
    quoteStyle = 'double';
    const endQuote = findClosingQuote(trimmed, '"');
    value = trimmed.slice(1, endQuote);
    // Process escape sequences in double-quoted strings
    value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"');
    const afterQuote = trimmed.slice(endQuote + 1).trim();
    if (afterQuote.startsWith('#')) {
      inlineComment = afterQuote;
    }
  } else if (trimmed.startsWith("'")) {
    quoteStyle = 'single';
    const endQuote = findClosingQuote(trimmed, "'");
    value = trimmed.slice(1, endQuote);
    const afterQuote = trimmed.slice(endQuote + 1).trim();
    if (afterQuote.startsWith('#')) {
      inlineComment = afterQuote;
    }
  } else if (trimmed.startsWith('`')) {
    quoteStyle = 'backtick';
    const endQuote = findClosingQuote(trimmed, '`');
    value = trimmed.slice(1, endQuote);
    const afterQuote = trimmed.slice(endQuote + 1).trim();
    if (afterQuote.startsWith('#')) {
      inlineComment = afterQuote;
    }
  } else {
    // Unquoted - check for inline comment
    const commentIndex = trimmed.indexOf(' #');
    if (commentIndex > 0) {
      value = trimmed.slice(0, commentIndex);
      inlineComment = trimmed.slice(commentIndex + 1);
    }
  }

  return { value, quoteStyle, inlineComment };
}

/**
 * Find the index of the closing quote character
 * Returns the index of the closing quote, or str.length - 1 if not found
 */
function findClosingQuote(str: string, quoteChar: string): number {
  let i = 1; // Start after opening quote
  while (i < str.length) {
    if (str[i] === quoteChar && str[i - 1] !== '\\') {
      return i;
    }
    i++;
  }
  // No closing quote found - return last valid index to preserve value
  // This handles malformed env files gracefully
  return str.length - 1;
}
