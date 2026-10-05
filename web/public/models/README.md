# 3D vehicle models

`cars/` holds one model per body type (sedan, hatchback, SUV, pickup, minivan), generated with
Meshy and optimised for the web by `npm run models:meshy` (see `scripts/meshy-generate.mjs`).
The script registers each model in `src/config/carModels.generated.json`; body types without a
model fall back to the built-in extruded car, so the app works before any model is generated.

Models are generated in white paint. The viewer recolours bright, unsaturated texels at runtime,
so one model serves every paint colour while tyres, glass and lights keep their baked look.

If a generated car faces the wrong way, set `rotationY` (radians) for it in
`src/config/carModels.generated.json`.

A vehicle can still point `model_3d_url` at its own licensed `.glb`; name its body material
"paint" (or "body") so the colour picker can recolour it.
