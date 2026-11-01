'use strict';

const { spawn } = require('child_process');
const path = require('path');

console.log('\n=============================================================');
console.log('  🎓 CampusCloud - Smart Campus Resource Management System');
console.log('  Starting Full-Stack Local Environment...');
console.log('=============================================================\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// 1. Start Backend Express Server
const backend = spawn(npmCmd, ['run', 'start'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' },
});

backend.stdout.on('data', (d) => {
  process.stdout.write(`\x1b[36m[Backend]\x1b[0m ${d.toString()}`);
});
backend.stderr.on('data', (d) => {
  process.stderr.write(`\x1b[31m[Backend Err]\x1b[0m ${d.toString()}`);
});

// 2. Start Frontend Vite Dev Server
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' },
});

frontend.stdout.on('data', (d) => {
  process.stdout.write(`\x1b[32m[Frontend]\x1b[0m ${d.toString()}`);
});
frontend.stderr.on('data', (d) => {
  process.stderr.write(`\x1b[33m[Frontend Err]\x1b[0m ${d.toString()}`);
});

function cleanup() {
  console.log('\nStopping CampusCloud services...');
  try {
    if (isWin) {
      if (backend.pid) spawn('taskkill', ['/pid', backend.pid, '/f', '/t']);
      if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid, '/f', '/t']);
    } else {
      backend.kill('SIGINT');
      frontend.kill('SIGINT');
    }
  } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

