import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('ordinary visual-test selection excludes the current-service Arcade canary', async () => {
  const root = new URL('../../', import.meta.url);
  const { scripts } = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  // Execute the actual script's shell expansion, intercepting only Node's launch.
  // A canary accidentally renamed to *.test.mjs must fail this offline contract.
  const selected = spawnSync('/bin/sh', ['-c', `node() { printf '%s\\n' "$@"; }; ${scripts['visuals:test']}`], { cwd: root, encoding: 'utf8' });
  assert.equal(selected.status, 0, selected.stderr);
  const args = selected.stdout.trim().split('\n');
  const canaries = [];
  for (const file of await readdir(new URL('./', import.meta.url))) {
    if (!file.endsWith('.mjs') || file === 'offline-contract.test.mjs') continue;
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    if (source.includes('C06-003/C06-006: current Arcade')) canaries.push(`tools/visuals/${file}`);
  }
  assert.equal(canaries.length, 1, 'retain one explicit current-service canary');
  assert.ok(!args.includes(canaries[0]), `offline visual tests include ${canaries[0]}`);
  const online = spawnSync('/bin/sh', ['-c', `node() { printf '%s\\n' "$@"; }; ${scripts['visuals:test:online']}`], { cwd: root, encoding: 'utf8' });
  assert.equal(online.status, 0, online.stderr);
  assert.ok(online.stdout.trim().split('\n').includes(canaries[0]), 'online script must run the retained canary');
  assert.match(scripts.check, /npm run visuals:test(?:\s|$)/);
  assert.doesNotMatch(scripts.check, /visuals:test:online/);
});
