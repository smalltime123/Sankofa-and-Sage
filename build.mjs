import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import './check.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const webFiles = ['index.html', 'app.js', 'menu-data.js', 'styles.css', 'favicon.svg', 'photo-credits.html', 'WEBSITE_PROMPT.md', 'images', 'fonts'];
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of webFiles) await cp(path.join(root, file), path.join(output, file), { recursive: true });
await writeFile(path.join(output, '.nojekyll'), '');
console.log('Build ready in dist/. Upload its contents to any static website host.');
