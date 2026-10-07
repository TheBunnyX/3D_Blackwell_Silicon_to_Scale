# Blackwell — Silicon to Scale

An interactive 3D journey in the browser: one continuous camera move from a data center aisle down to a single silicon atom, crossing eleven orders of magnitude.

The whole experience is one HTML file. It needs no server, no install and no network connection — Three.js is inlined and every texture, model and sound is generated in code.

> This is a conceptual visualization. Layouts, floorplans and hardware are illustrative and unbranded. It is not affiliated with or endorsed by NVIDIA.

## The journey

| # | Scene | Scale |
|---|---|---|
| 01 | Data center | aisle ≈ 30 m |
| 02 | Server rack | rack ≈ 2 m |
| 03 | GPU (exploded view) | card ≈ 36 cm |
| 04 | Package | ≈ 5 cm |
| 05 | Die | ≈ 27 mm |
| 06 | Processing block | ≈ 0.9 mm |
| 07 | CUDA core | ≈ 50 µm |
| 08 | Transistor | tens of nm |
| 09 | Crystal lattice | 0.543 nm |
| 10 | Silicon atom | ≈ 111 pm radius |

The full run takes about 1 minute 49 seconds.

## Run it locally

Open `index.html` in a browser. That is all.

You need a browser with WebGL and hardware acceleration turned on (current Chrome, Edge, Firefox or Safari).

## Controls

| Input | Action |
|---|---|
| Drag | Look around |
| Scroll / pinch | Move forward or back along the journey |
| `Space` | Play / pause |
| `R` | Restart |
| `E` | Explore mode (free look, wider angles) |
| `I` | Explain panel (plain-language notes for each scene) |
| `←` `→` (or `↑` `↓`) | Step 2 seconds back / forward |
| Progress bar | Click or drag to seek |

The buttons in the bottom bar also toggle sound (off by default), quality (`HQ` / `LQ`) and the frame (`FULL` window or `16:9`).

## URL parameters

| Parameter | Values | Default |
|---|---|---|
| `q` | `high`, `low` | `low` on phones and on machines with 4 or fewer CPU cores, otherwise `high` |
| `frame` | `full`, `wide` | `full` |
| `qa` | (no value) | off — exposes `window.__BW` for automated tests |

Example: `index.html?q=low&frame=wide`

## Project layout

```
index.html       Source of truth. The complete app in one file.
build.mjs        Builds deploy/ from index.html (Node, no dependencies).
vercel.json      Vercel build settings, security headers, cache rules.
.vercelignore    Keeps reference images and docs out of the upload.
deploy/          Build output — the folder that gets served.
  index.html       Page and app code.
  assets/          Three.js bundle and touch icon, content-hashed.
  _headers         Same headers for Netlify / Cloudflare Pages.
*.jpg            Reference screenshots. Not used by the page.
```

Edit `index.html` only. Everything in `deploy/` except `_headers` is generated; run the build after each change.

## Build

Requires Node.js 18 or newer.

```bash
node build.mjs
```

The build prints the size of each output file, raw and Brotli-compressed.

## Deploy to Vercel

`vercel.json` already tells Vercel to run `node build.mjs` and serve `deploy/`, so there is nothing to configure.

**From Git**

1. Push this folder to a GitHub, GitLab or Bitbucket repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Leave every setting at its default and click **Deploy**.

**From the command line**

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

Run both commands from the project root, not from `deploy/`.

## Bandwidth

The single-file `index.html` is 836 kB, about 192 kB after Brotli. Roughly 80 % of that is the Three.js bundle, which never changes. The build splits it out so it is downloaded once per visitor instead of once per release:

| File | Raw | Brotli | Caching |
|---|---|---|---|
| `index.html` | 147 kB | ≈ 41 kB | Revalidated on each visit; an unchanged page costs a `304` with no body |
| `assets/three-r160.<hash>.js` | 674 kB | ≈ 141 kB | `immutable`, one year |
| `assets/touch-icon.<hash>.png` | 11 kB | 11 kB | `immutable`, one year; only fetched when the page is added to an iOS home screen |

Brotli figures are from the build script at maximum quality; a CDN compressing on the fly will come out slightly larger.

What this means in practice:

- **First visit:** about 182 kB, slightly less than the single file.
- **Repeat visit, nothing changed:** a few hundred bytes of headers.
- **Repeat visit after you ship a change to the page:** about 41 kB instead of 192 kB, because the Three.js bundle is still cached.

Asset file names contain a hash of their content, so a changed file always gets a new URL and long-lived caching can never serve a stale copy.

The page makes no other requests: no fonts, images, analytics or API calls.

## Other static hosts

Run `node build.mjs` and upload the `deploy/` folder. Netlify and Cloudflare Pages read `deploy/_headers` automatically. On any other host, set `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` and make sure Brotli or gzip is enabled for `.html` and `.js`.

## Performance notes

- Resolution adapts automatically: it steps down when frames take too long and steps back up only after a sustained smooth run.
- Shaders, geometry and textures for every scene are warmed up behind the loading screen, so loading takes a little longer but scene changes do not hitch.
- If playback is still not smooth, switch to `LQ` (or open with `?q=low`), which also disables shadows and MSAA.
- Check that hardware acceleration is enabled. In Chrome or Edge, `chrome://gpu` should not list WebGL as software-only.

## Credits

- [Three.js](https://threejs.org/) r160 and its post-processing add-ons, MIT License, © three.js authors. Bundled with esbuild and inlined.
- Public figures quoted in the visualization (92.2 billion transistors, ≈ 750 mm², TSMC 4N) describe the GB202 die. All physical layouts shown are illustrative.
