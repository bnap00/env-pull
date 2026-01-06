#!/usr/bin/env node
/**
 * env-sync - Synchronize .env files with their example counterparts
 */

import { createCli } from './cli.js';

const program = createCli();
program.parse();
