/**
 * Type definitions for env file parsing and manipulation
 */

/**
 * Represents a variable in an env file
 */
export interface EnvVariable {
  type: 'variable';
  key: string;
  value: string;
  rawValue: string; // Original value with quotes
  quoteStyle: 'single' | 'double' | 'backtick' | 'none';
  hasExport: boolean; // Whether prefixed with 'export'
  inlineComment?: string; // Comment after value
  precedingComments: string[]; // Comments directly above this variable
}

/**
 * Represents a comment line in an env file
 */
export interface EnvComment {
  type: 'comment';
  content: string; // Including the # character
}

/**
 * Represents an empty line in an env file
 */
export interface EnvEmpty {
  type: 'empty';
}

/**
 * Union type for any line in an env file
 */
export type EnvLine = EnvVariable | EnvComment | EnvEmpty;

/**
 * Represents a fully parsed env file
 */
export interface ParsedEnvFile {
  lines: EnvLine[];
  variables: Map<string, EnvVariable>; // Quick lookup by key
  filePath: string;
}

/**
 * Diff types for comparing env files
 */
export type DiffType = 'added' | 'removed' | 'unchanged';

/**
 * Represents the diff of a single variable between files
 */
export interface VariableDiff {
  key: string;
  diffType: DiffType;
  exampleValue?: string; // Value from example file
  currentValue?: string; // Value from current env file
  exampleLine?: EnvVariable;
  currentLine?: EnvVariable;
}

/**
 * Complete diff result between example and target files
 */
export interface EnvDiff {
  variableDiffs: VariableDiff[];
  hasChanges: boolean;
  summary: {
    added: number;
    removed: number;
    unchanged: number;
  };
}

/**
 * Configuration for the sync operation
 */
export interface SyncConfig {
  exampleFile: string;
  targetFile: string;
  quiet: boolean;
  dryRun: boolean;
  backup: boolean;
}

/**
 * Pattern for auto-detecting env file pairs
 */
export interface FilePattern {
  example: string;
  target: string;
}
