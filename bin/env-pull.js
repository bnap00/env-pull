#!/usr/bin/env node

import('../dist/index.js').catch((error) => {
  console.error('Failed to start env-sync:', error.message);
  process.exit(1);
});
