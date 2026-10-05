import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'models')
await mkdir(root, { recursive: true })

const files = {
  sedan: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb',
  hatchback:
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb',
  suv:
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb',
}

for (const [name, url] of Object.entries(files)) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed ${name}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const out = path.join(root, `${name}.glb`)
  await writeFile(out, buf)
  console.log(`Wrote ${out} (${buf.length} bytes)`)
}
