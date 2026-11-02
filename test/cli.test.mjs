import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'env-pull.js');

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'env-pull-test-'));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function run(dir, args) {
  return execFileSync(process.execPath, [bin, ...args], {
    cwd: dir,
    encoding: 'utf-8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
}

test('creates a missing target file from the example', () => {
  withTempDir((dir) => {
    writeFileSync(join(dir, '.env.example'), 'API_KEY=\nPORT=3000\n');
    run(dir, ['-q']);
    const content = readFileSync(join(dir, '.env'), 'utf-8');
    assert.match(content, /^API_KEY=$/m);
    assert.match(content, /^PORT=3000$/m);
  });
});

test('creates new env files readable by the owner only', { skip: process.platform === 'win32' }, () => {
  withTempDir((dir) => {
    writeFileSync(join(dir, '.env.example'), 'API_KEY=\n');
    run(dir, ['-q']);
    assert.equal(statSync(join(dir, '.env')).mode & 0o777, 0o600);
  });
});

test('dry run does not print existing secret values', () => {
  withTempDir((dir) => {
    writeFileSync(join(dir, '.env.example'), 'API_KEY=\nDATABASE_URL=\nNEW_VAR=default\n');
    writeFileSync(join(dir, '.env'), 'API_KEY=sk_live_supersecret\nDATABASE_URL=postgres://u:hunter2@db/app\n');
    const output = run(dir, ['-q', '--dry-run']);
    assert.doesNotMatch(output, /supersecret/);
    assert.doesNotMatch(output, /hunter2/);
    assert.match(output, /API_KEY=<redacted>/);
    // Dry run must not modify the file
    assert.doesNotMatch(readFileSync(join(dir, '.env'), 'utf-8'), /NEW_VAR/);
  });
});

test('check exits non-zero when variables are missing', () => {
  withTempDir((dir) => {
    writeFileSync(join(dir, '.env.example'), 'API_KEY=\nPORT=3000\n');
    writeFileSync(join(dir, '.env'), 'API_KEY=abc\n');
    assert.throws(() => run(dir, ['check']), (err) => err.status === 1);
    writeFileSync(join(dir, '.env'), 'API_KEY=abc\nPORT=1\n');
    assert.match(run(dir, ['check']), /in sync/);
  });
});
