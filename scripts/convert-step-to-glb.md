# From supplier STEP files to an optimised GLB

This is the path from a supplier's CAD (STEP or IGES) to the files the 3D viewer loads.
Target: under 3 MB for the assembled model of one product, with each part as its own GLB
so the viewer can explode, select and fade parts independently.

## 0. Before you start

- Get written permission from the supplier to publish a simplified version of their CAD.
- Ask for the assembly as one STEP file with each part as a separate body, in millimetres.
- Keep the original files outside the repository. Only the optimised GLBs are committed.

## 1. Tessellate in FreeCAD (STEP to mesh)

1. Open FreeCAD, then File > Import, and choose the `.step` file.
2. Check the model tree: there should be one body per physical part. Rename bodies to match
   the part ids in `content/products/{productId}.json` (for example `stator`, `bell-housing`).
3. Remove internal detail nobody will see: threads, tiny fillets, text engravings, fasteners
   that are not listed as parts.
4. Select all bodies and use File > Export as glTF (`.glb`), or export each body as `.obj` if
   your FreeCAD version has no glTF exporter. Keep units in millimetres; the viewer rescales.

Tessellation quality is set in Edit > Preferences > Import-Export > Mesh. A surface deviation
of 0.05 mm and an angular deviation of 15 degrees is a good start for drone parts.

## 2. Clean up in Blender

1. File > Import > glTF 2.0 (or OBJ).
2. Apply transforms to every object (Object > Apply > All Transforms). Leave every part in
   its assembled position: the viewer moves parts away from these positions when exploding.
3. Set the up axis so the main assembly axis is +Y (for a motor, the shaft points up).
4. Reduce triangle count: add a Decimate modifier (Collapse, ratio 0.2 to 0.5), check edges
   still read well, then apply. Aim for under 60,000 triangles for the whole assembly.
5. Merge materials: give every part one material from this short list, so the scene stays
   consistent: aluminium, steel, copper, magnet, carbon, plastic, rubber.
6. Delete cameras, lights and empty objects.

## 3. Export

Export twice from Blender with File > Export > glTF 2.0, format `glTF Binary (.glb)`:

- **Assembled model**: select all parts, tick "Selected objects", save as `assembled.glb`.
- **One file per part**: select one part at a time and save as `{partId}.glb`.
  Keep "Apply Modifiers" ticked and do not move the part before exporting.

Optionally export a higher-detail version of a part (less decimation) as
`{partId}.detail.glb`. The viewer loads it only when the user zooms in close.

## 4. Compress with Draco

Install the glTF Transform CLI once: `npm install --global @gltf-transform/cli`. Then, for every file:

```bash
gltf-transform optimize input.glb output.glb --compress draco --texture-compress webp
```

Check sizes. If the assembled model is over 3 MB, decimate further in step 2.
The viewer already ships the Draco decoder (copied into `/public/draco` on install).

## 5. Place the files and edit the manifest

Put the files in `public/assets/models/{productId}/`, next to `manifest.json`. Then, in the
manifest, for each part:

```json
{
  "id": "stator",
  "glb": "/assets/models/tm-mot-2807-1300/stator.glb",
  "glbDetail": "/assets/models/tm-mot-2807-1300/stator.detail.glb",
  "procedural": null,
  "modelSource": "supplier-cad"
}
```

and at the top level:

```json
{
  "modelSource": "supplier-cad",
  "disclaimer": null,
  "assembledGlb": "/assets/models/tm-mot-2807-1300/assembled.glb",
  "procedural": null
}
```

Leave `axis`, `distance`, `order`, `layers` and `assemblyCaption` as they are unless the
real part needs different values. `distance` is in multiples of the assembled model's
bounding radius, so it carries over between the illustrative and the real model.

That is the only change needed. Run `npm run validate`: it checks every path exists, that
part ids match the product content, and that the disclaimer rule still holds.

## Photo spin instead of CAD

When only a physical sample exists, photograph it on a turntable: 24 to 72 frames, evenly
spaced, same lighting and framing, plain background. Save as
`public/assets/photos/{productId}/spin/01.webp` and so on, then add to the product content:

```json
"photoSpin": {
  "frames": ["/assets/photos/tm-mot-2807-1300/spin/01.webp", "..."],
  "capturedOn": "2026-07-18",
  "modelSource": "scanned-sample",
  "width": 1600,
  "height": 1200
}
```

Use `scanned-sample` only for real photos of the actual sample we inspected.
