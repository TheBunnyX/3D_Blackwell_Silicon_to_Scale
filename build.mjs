#!/usr/bin/env node
/* =====================================================================
   Build the deployable site in ./deploy from the single-file index.html.

   index.html stays the source of truth and keeps working offline as one
   file. For hosting, the parts that never change are split out so the
   browser and the CDN can cache them forever:

     deploy/index.html                     page + app code (revalidated)
     deploy/assets/three-r160.<hash>.js    Three.js bundle (immutable)
     deploy/assets/touch-icon.<hash>.png   iOS home-screen icon (immutable)

   No dependencies: `node build.mjs`
   ===================================================================== */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { brotliCompressSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'deploy'), ASSETS = join(OUT, 'assets');
const hash = buf => createHash('sha256').update(buf).digest('hex').slice(0, 10);
const kb = n => (n / 1024).toFixed(1).padStart(7) + ' kB';

/** replace exactly one match, or stop the build */
function extract(html, re, what, replace) {
  const m = html.match(re);
  if (!m) { console.error(`build: could not find ${what} in index.html`); process.exit(1); }
  return html.replace(m[0], () => replace(m));
}

let html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const sourceBytes = Buffer.byteLength(html);
rmSync(ASSETS, { recursive: true, force: true });
mkdirSync(ASSETS, { recursive: true });
const files = [];
const emit = (name, data) => { writeFileSync(join(ASSETS, name), data); files.push([`assets/${name}`, Buffer.from(data)]); return `assets/${name}`; };

// Three.js bundle → external, content-hashed script
let threeUrl;
html = extract(html, /<script id="three-bundle">([\s\S]*?)<\/script>/, 'the inlined Three.js bundle', m => {
  threeUrl = emit(`three-r160.${hash(m[1])}.js`, m[1]);
  return `<script id="three-bundle" src="${threeUrl}"></script>`;
});
// start fetching the bundle while the rest of the page is still parsing
html = extract(html, /<title>/, 'the <title> tag', () => `<link rel="preload" as="script" href="${threeUrl}">\n<title>`);

// iOS touch icon → external file (only requested when someone adds the page to a home screen)
html = extract(html, /<link rel="apple-touch-icon" href="data:image\/png;base64,([^"]+)">/, 'the inlined apple-touch-icon', m => {
  const png = Buffer.from(m[1], 'base64');
  return `<link rel="apple-touch-icon" href="${emit(`touch-icon.${hash(png)}.png`, png)}">`;
});

writeFileSync(join(OUT, 'index.html'), html);
files.unshift(['index.html', Buffer.from(html)]);

console.log(`source index.html ${kb(sourceBytes)}\n\ndeploy/`);
for (const [name, buf] of files) {
  const br = name.endsWith('.png') ? buf.length : brotliCompressSync(buf).length;
  console.log(`  ${name.padEnd(36)} ${kb(buf.length)}  →  ${kb(br)} on the wire`);
}
