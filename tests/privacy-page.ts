import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const PRIVACY_URL = 'https://pitchcrafter.glmlabs.io/privacy';
const policyPath = path.join('public', 'privacy', 'index.html');
const policyHtml = readFileSync(policyPath, 'utf8');

function listSourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'package-lock.json') {
      continue;
    }
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }
    if (/\.(tsx?|jsx?|json|md|html|cjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function reservePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not reserve a local port'));
        return;
      }
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
    server.on('error', reject);
  });
}

function stopServer(child: ChildProcess) {
  if (child.pid === undefined || child.exitCode !== null) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
}

async function waitForPrivacy(port: number, child: ChildProcess) {
  const deadline = Date.now() + 90_000;
  let logs = '';
  child.stdout?.on('data', (chunk: Buffer) => {
    logs += chunk.toString();
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    logs += chunk.toString();
  });
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next server exited with ${child.exitCode}\n${logs}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/privacy`, { redirect: 'manual' });
      await response.arrayBuffer();
      if (response.status === 200) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for /privacy\n${logs}`);
}

async function follow(port: number, pathname: string) {
  let current = pathname;
  const seen = new Set<string>();
  for (let hop = 0; hop < 4; hop += 1) {
    assert.equal(seen.has(current), false, `redirect loop at ${current}`);
    seen.add(current);
    const response = await fetch(`http://127.0.0.1:${port}${current}`, { redirect: 'manual' });
    const body = await response.text();
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      assert.ok(location, `redirect from ${current} has no Location header`);
      current = new URL(location, `http://127.0.0.1:${port}`).pathname;
      continue;
    }
    return { status: response.status, body, hops: hop, contentType: response.headers.get('content-type') };
  }
  throw new Error(`too many redirects starting at ${pathname}`);
}

function assertPrivacyLinks() {
  const home = readFileSync('pages/index.tsx', 'utf8');
  assert.equal((home.match(/href="\/privacy"/g) ?? []).length, 2);
  assert.match(home, /data-testid="link-footer-privacy"[\s\S]*?>\s*Privacy\s*</);
  assert.match(home, /data-testid="link-auth-privacy"[\s\S]*?>\s*Privacy\s*</);

  const deletePage = readFileSync('pages/account/delete.tsx', 'utf8');
  assert.match(deletePage, /data-testid="link-sign-in-privacy"[\s\S]*?>\s*Privacy\s*</);

  const androidDocs = readFileSync('docs/ANDROID.md', 'utf8');
  assert.match(androidDocs, /https:\/\/pitchcrafter\.glmlabs\.io\/privacy/);

  for (const file of listSourceFiles('mobile')) {
    const source = readFileSync(file, 'utf8');
    const urls = source.match(/https?:\/\/[^\s"'`)]*privacy[^\s"'`)]*/gi) ?? [];
    for (const url of urls) {
      assert.equal(url.replace(/[.,]$/, ''), PRIVACY_URL, `${file} privacy link`);
    }
  }
}

assert.match(policyHtml, /Privacy/);
assert.match(policyHtml, /Google shares your name and email address with us/);
assert.match(policyHtml, /The Android app receives your name and email address from Google\./);
assertPrivacyLinks();

const port = await reservePort();
const built = existsSync(path.join('.next', 'BUILD_ID'));
const nextBin = path.join('node_modules', 'next', 'dist', 'bin', 'next');
const args = built
  ? [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)]
  : [nextBin, 'dev', '-H', '127.0.0.1', '-p', String(port)];
const child = spawn(process.execPath, args, {
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
});

try {
  await waitForPrivacy(port, child);

  const privacy = await follow(port, '/privacy');
  assert.equal(privacy.status, 200);
  assert.equal(privacy.hops, 0);
  assert.match(privacy.body, /Privacy/);
  assert.equal(privacy.body, policyHtml);
  assert.match(privacy.contentType ?? '', /text\/html/);

  const slashed = await follow(port, '/privacy/');
  assert.equal(slashed.status, 200);
  assert.ok(slashed.hops <= 1, `unexpected redirect hops: ${slashed.hops}`);
  assert.match(slashed.body, /Privacy/);
  assert.equal(slashed.body, policyHtml);
} finally {
  stopServer(child);
}

console.log('privacy page tests passed');
