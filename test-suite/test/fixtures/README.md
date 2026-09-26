# Test assets

`assets.ts` generates deterministic assets in memory; CI does not download samples.
Only those generated fixtures are original test data covered by the repository MIT license.

- `model()`: glTF 2.0 binary, three vertices, one red material, a nested mesh node and
  `FixtureBounce`, a two-second vertical translation animation. Static bounds are
  `[-1, 0, 0]` to `[1, 2, 0]`, measured from vertices, with zero grounding offset.
  `model(2)` changes the width to four units while preserving names and hierarchy.
- `splat()`: binary little-endian Gaussian PLY, nine red gaussians in a 3×3 grid.
- `texture({ width, height, alpha, format, blocks })`: `png`, `jpeg`, `tga`, `bmp`, `hdr` or
  `exr`, any size (npot included). `pixels(opts)` is the target RGBA: red ramps with x, green
  with y, blue is an 8px checker, and alpha (png, tga, bmp only) falls from the top-left. PNG,
  TGA and BMP encode those bytes exactly; JPEG applies its lossy YCbCr roundtrip. JPEG is
  baseline 4:4:4 with quantizer 1 and DC-only blocks, so its target pixels are one colour per
  8×8 block (`blocks: true` gives the other formats the same image). TGA is uncompressed
  true-colour and BMP is `BI_RGB`, both bottom-up. HDR is flat RGBE and EXR is a single-part
  uncompressed float B/G/R file; both hold `byte / 255 * HDR_SCALE` (4). Browsers decode png,
  jpeg and bmp; only the pipeline decodes tga, hdr and exr.
- `normalMap({ width, height })`: opaque png tangent-space normals, blue ≥ 128 everywhere.
- `classicScripts(tag)`: three classic scripts logging load order to `window.__e2eOrder` and
  initialize order to `window.__e2eInit`; `<tag>-c.js` throws from `initialize` at
  `CLASSIC_THROW_LINE`. Use one fixed tag in both halves of a parity run, so the script text
  (and anything built from it) is identical.
- `files/test.png` and `files/test.wav`: existing suite image and audio fixtures.
- `files/courier-prime.ttf`: unmodified Courier Prime Regular 1.203 (98,156 bytes),
  Copyright (c) 2013 Quote-Unquote Apps, designer Alan Dague-Greene. Copied from the
  supplied Downloads font. Licensed under SIL Open Font License 1.1, with Reserved
  Font Name Courier Prime. The full copyright and OFL text are embedded in its
  readable `name` table (license record 13); see https://openfontlicense.org/.
  This font retains its OFL license and is not covered by the repository MIT license.
- `files/ammo/`: unmodified Ammo.js glue, WebAssembly and JavaScript fallback copied
  from `playcanvas/engine/examples/assets/wasm/ammo` at Engine revision
  `804deb9844413edc329bdc0ab773126b3cedc85c`; last artifact update
  `4471111d0779824c458ab69a3185aaae7e23c70e`. These Bullet Physics ports retain
  their upstream zlib license, included as `files/ammo/LICENSE`, verified against
  https://github.com/kripken/ammo.js/blob/main/LICENSE. Joint tests upload these
  files and configure the WASM module through the Editor; no store catalog is needed.
  SHA-256:

  - `ammo.js`: `ef166d1315bc4a6441a8de341ecdf6ac4e7d69055caec65c523ed1a4e8e19b15`
  - `ammo.wasm.js`: `5645b5a0c4f03be9d9d1ae604ffacd5e5e525310cfd1d0ed27474cdd1f34aab0`
  - `ammo.wasm.wasm`: `a61b504d4a6ce6bb93bd843e0f61edb8115e7317f1b3462247031a83ddb25d09`

The triangle faces +Z and is double-sided. A camera on +Z looking down -Z sees it.
Runtime tests verify loaded Engine resources; the animation's bounds require a
runtime check because the node moves beyond its static bounds.
