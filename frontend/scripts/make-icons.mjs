// Writes the PWA icon PNGs into public/icons before every build.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'public', 'icons');
mkdirSync(out, { recursive: true });
const icons = JSON.parse(readFileSync(join(here, 'icons.json'), 'utf8'));
for (const [name, b64] of Object.entries(icons)) {
  writeFileSync(join(out, `${name}.png`), Buffer.from(b64, 'base64'));
}
console.log('PWA icons written:', Object.keys(icons).join(', '));
