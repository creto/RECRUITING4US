#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'

function run(cmd, args, opts = {}) {
  console.log(`+ ${cmd} ${args.join(' ')}`)
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

// Never ship a stale prebuild
if (existsSync('.vercel/output')) {
  rmSync('.vercel/output', { recursive: true, force: true })
}

run('npm', ['--prefix', 'website', 'ci'])
run('npm', ['--prefix', 'website', 'run', 'build'])
run('npm', ['ci'])
run('npm', ['run', 'build'])
run('node', ['scripts/merge-website-into-vercel-output.mjs'])
console.log('[vercel-unified-build] done')
