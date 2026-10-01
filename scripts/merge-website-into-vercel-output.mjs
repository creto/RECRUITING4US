#!/usr/bin/env node
/**
 * After `npm run build` (Nitro → .vercel/output) and `npm run website:build`,
 * overlay the marketing site onto the static output so `/` is the immersive
 * website while `/login` and product routes stay on the TanStack app.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const siteDist = join(root, 'website', 'dist')
const staticDir = join(root, '.vercel', 'output', 'static')
const configPath = join(root, '.vercel', 'output', 'config.json')

if (!existsSync(siteDist)) {
  console.error('[merge-website] missing website/dist — run website:build first')
  process.exit(1)
}
if (!existsSync(staticDir)) {
  console.error('[merge-website] missing .vercel/output/static — run app build first')
  process.exit(1)
}

function copyRecursive(src, dest) {
  const st = statSync(src)
  if (st.isDirectory()) {
    mkdirSync(dest, { recursive: true })
    for (const name of readdirSync(src)) {
      copyRecursive(join(src, name), join(dest, name))
    }
    return
  }
  cpSync(src, dest)
}

for (const name of readdirSync(siteDist)) {
  copyRecursive(join(siteDist, name), join(staticDir, name))
}
console.log('[merge-website] overlaid website/dist → .vercel/output/static')

// Marketing SPA stubs (seo-routes writes dist/<route>/index.html; keep refresh working).
const spaPaths = ['/seguridad', '/integraciones', '/contacto']
if (existsSync(configPath)) {
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'))
  cfg.routes = Array.isArray(cfg.routes) ? cfg.routes : []
  const extras = []
  for (const src of spaPaths) {
    const dest = `${src}/index.html`
    extras.push({ src, dest, check: true })
    extras.push({ src: `${src}/`, dest, check: true })
  }
  cfg.routes = [...extras, ...cfg.routes]
  writeFileSync(configPath, JSON.stringify(cfg, null, 2) + '\n')
  console.log('[merge-website] prepended SPA routes for', spaPaths.join(', '))
} else {
  console.warn('[merge-website] no config.json — SPA stubs may 404 on refresh')
}

// Vercel rejects discontinued nodejs20.x runtimes from older Nitro presets.
for (const rel of [
  join('.vercel', 'output', 'functions', '__server.func', '.vc-config.json'),
  join('.vercel', 'output', 'nitro.json'),
]) {
  const abs = join(root, rel)
  if (!existsSync(abs)) continue
  const raw = readFileSync(abs, 'utf8')
  if (!raw.includes('nodejs20.x')) continue
  writeFileSync(abs, raw.replaceAll('nodejs20.x', 'nodejs24.x'))
  console.log('[merge-website] bumped runtime to nodejs24.x in', rel)
}

