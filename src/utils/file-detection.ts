/**
 * Utility for auto-detecting env file pairs
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FilePattern } from '../types/env.js';

/**
 * Default patterns for detecting env file pairs
 */
export const DEFAULT_PATTERNS: FilePattern[] = [
  { example: '.env.example', target: '.env' },
  { example: '.env.sample', target: '.env' },
  { example: '.env.template', target: '.env' },
  { example: '.env.example', target: '.env.local' },
  { example: '.env.local.example', target: '.env.local' },
  { example: '.env.development.example', target: '.env.development' },
  { example: '.env.production.example', target: '.env.production' },
  { example: '.dev.vars.example', target: '.dev.vars' }, // Cloudflare Workers
  { example: 'example.env', target: '.env' },
  { example: 'sample.env', target: '.env' },
];

/**
 * Detect env file pairs in the given directory
 * Returns pairs where the example file exists
 */
export function detectFilePairs(directory: string): FilePattern[] {
  const detectedPairs: FilePattern[] = [];

  for (const pattern of DEFAULT_PATTERNS) {
    const examplePath = join(directory, pattern.example);
    if (existsSync(examplePath)) {
      detectedPairs.push({
        example: pattern.example,
        target: pattern.target,
      });
    }
  }

  // Remove duplicates (same target file)
  const uniquePairs: FilePattern[] = [];
  const seenTargets = new Set<string>();

  for (const pair of detectedPairs) {
    if (!seenTargets.has(pair.target)) {
      seenTargets.add(pair.target);
      uniquePairs.push(pair);
    }
  }

  return uniquePairs;
}

/**
 * Check if a file exists
 */
export function fileExists(path: string): boolean {
  return existsSync(path);
}
