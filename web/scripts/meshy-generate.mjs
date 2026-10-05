#!/usr/bin/env node
/**
 * Generates the FUELGO body-type car models with the Meshy Text-to-3D API,
 * optimizes them for the web and registers them for the 3D viewer.
 *
 *   MESHY_API_KEY=… npm run models:meshy                 # all body types
 *   MESHY_API_KEY=… npm run models:meshy -- --only suv   # just one
 *   npm run models:meshy -- --dry-run                     # print the plan, no API calls
 *   npm run models:meshy -- --force                       # ignore saved task ids, regenerate
 *
 * Each model is generated in white paint; the viewer recolours the paint at runtime,
 * so one model serves every paint colour. Task ids are saved to scripts/.meshy-state.json
 * so an interrupted run resumes without spending credits twice.
 */
import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const webRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const RAW_DIR = path.join(webRoot, 'scripts', '.meshy-raw')
const OUT_DIR = path.join(webRoot, 'public', 'models', 'cars')
const STATE_FILE = path.join(webRoot, 'scripts', '.meshy-state.json')
const MANIFEST = path.join(webRoot, 'src', 'config', 'carModels.generated.json')
const API = 'https://api.meshy.ai/openapi/v2/text-to-3d'

const STYLE =
  'Generic unbranded modern car, no logos, no badges, no text, no license plate. ' +
  'Glossy solid white paint on all body panels, dark tinted windows, black tyres, ' +
  'machined silver alloy wheels, clear headlights, red tail lights. ' +
  'Realistic proportions, clean surfaces, isolated object, wheels on the ground.'

const TEXTURE =
  'Pure glossy white automotive paint on every body panel, black rubber tyres, ' +
  'dark smoked glass, silver wheels, no logos, no decals, no dirt'

export const BODY_TYPES = {
  sedan: `A four-door compact sedan with a separate boot, like a family saloon. ${STYLE}`,
  hatchback: `A five-door compact hatchback with a short rear and steep tailgate. ${STYLE}`,
  suv: `A five-door mid-size SUV crossover with raised ride height and roof rails. ${STYLE}`,
  pickup: `A four-door double-cab pickup truck with an open cargo bed. ${STYLE}`,
  minivan: `A seven-seat minivan with a sliding side door and long roof. ${STYLE}`,
}

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const onlyArg = args.find((a, i) => args[i - 1] === '--only')
const only = onlyArg ? onlyArg.split(',').map((s) => s.trim()) : Object.keys(BODY_TYPES)
const dryRun = flag('dry-run')
const force = flag('force')

for (const t of only) {
  if (!BODY_TYPES[t]) {
    console.error(`Unknown body type "${t}". Choose from: ${Object.keys(BODY_TYPES).join(', ')}`)
    process.exit(1)
  }
}

const key = process.env.MESHY_API_KEY
if (!dryRun && !key) {
  console.error('MESHY_API_KEY is not set. Add it to your environment, or pass --dry-run to preview the plan.')
  process.exit(1)
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return fallback
  }
}

async function api(method, url, body) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.status === 429 && attempt < 5) {
      await sleep(2 ** attempt * 2000)
      continue
    }
    const text = await res.text()
    if (!res.ok) {
      const hint = res.status === 402 ? ' (out of Meshy credits)' : res.status === 401 ? ' (check MESHY_API_KEY)' : ''
      throw new Error(`Meshy ${method} ${url} → ${res.status}${hint}: ${text}`)
    }
    return JSON.parse(text)
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitFor(id, label) {
  let last = -1
  for (;;) {
    const task = await api('GET', `${API}/${id}`)
    if (task.progress !== last) {
      console.log(`  ${label}: ${task.status} ${task.progress ?? 0}%`)
      last = task.progress
    }
    if (task.status === 'SUCCEEDED') return task
    if (task.status === 'FAILED' || task.status === 'CANCELED') {
      throw new Error(`${label} ${task.status}: ${task.task_error?.message ?? 'no reason given'}`)
    }
    await sleep(5000)
  }
}

async function generate(type, state) {
  const s = (state[type] ??= {})
  const save = () => writeFile(STATE_FILE, JSON.stringify(state, null, 2))

  if (!s.preview) {
    const { result } = await api('POST', API, {
      mode: 'preview',
      prompt: BODY_TYPES[type],
      ai_model: 'latest',
      should_remesh: true,
      topology: 'triangle',
      target_polycount: 40000,
      target_formats: ['glb'],
    })
    s.preview = result
    await save()
  }
  await waitFor(s.preview, `${type} preview`)

  if (!s.refine) {
    const { result } = await api('POST', API, {
      mode: 'refine',
      preview_task_id: s.preview,
      enable_pbr: true,
      texture_resolution: '2k',
      texture_prompt: TEXTURE,
      target_formats: ['glb'],
    })
    s.refine = result
    await save()
  }
  const refined = await waitFor(s.refine, `${type} texture`)
  const glbUrl = refined.model_urls?.glb
  if (!glbUrl) throw new Error(`${type}: refine task has no GLB url`)

  const raw = path.join(RAW_DIR, `${type}.glb`)
  const res = await fetch(glbUrl)
  if (!res.ok) throw new Error(`${type}: download failed ${res.status}`)
  await writeFile(raw, Buffer.from(await res.arrayBuffer()))

  // Weld, simplify, meshopt-compress geometry and convert textures to 1K WebP: ~20 MB → < 1 MB.
  const out = path.join(OUT_DIR, `${type}.glb`)
  await run('npx', [
    'gltf-transform', 'optimize', raw, out,
    '--compress', 'meshopt',
    '--texture-compress', 'webp',
    '--texture-size', '1024',
    '--simplify-ratio', '0.5',
  ], { cwd: webRoot })
  console.log(`  ${type}: wrote ${path.relative(webRoot, out)}`)
  return { thumbnail: refined.thumbnail_url }
}

if (dryRun) {
  console.log('Dry run — no API calls. Would generate:')
  for (const t of only) console.log(`\n• ${t}\n  prompt:  ${BODY_TYPES[t]}\n  texture: ${TEXTURE}\n  → public/models/cars/${t}.glb`)
  process.exit(0)
}

await mkdir(RAW_DIR, { recursive: true })
await mkdir(OUT_DIR, { recursive: true })
const state = force ? {} : await readJson(STATE_FILE, {})
const manifest = await readJson(MANIFEST, {})

const results = await Promise.allSettled(only.map((t) => generate(t, state).then(() => t)))
for (const r of results) {
  if (r.status === 'fulfilled') {
    // rotationY is a per-model fix-up if Meshy faces a car the wrong way; edit by hand if needed.
    manifest[r.value] = { url: `/models/cars/${r.value}.glb`, rotationY: manifest[r.value]?.rotationY ?? 0 }
  } else {
    console.error(`✗ ${r.reason.message}`)
  }
}
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
console.log(`\nRegistered: ${Object.keys(manifest).join(', ') || 'none'} → src/config/carModels.generated.json`)
if (results.some((r) => r.status === 'rejected')) process.exit(1)
