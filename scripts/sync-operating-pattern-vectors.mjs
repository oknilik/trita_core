// Keep PDF-native paths in sync with the approved public SVGs. No raster fallback.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const dir = new URL('public/illustrations/operating-patterns/', root);
const vectors = {};
for (const file of readdirSync(dir).filter(f => f.endsWith('.svg')).sort()) {
  const svg = readFileSync(new URL(file, dir), 'utf8');
  const group = svg.match(/<g transform="([^"]+)"/);
  const paths = [...svg.matchAll(/<path\s+([^>]+)\/>/g)].map(([, attrs]) => Object.fromEntries([...attrs.matchAll(/(d|fill|transform)="([^"]*)"/g)].map(([, k, v]) => [k, v])));
  if (!group || !paths.length || paths.some(p => !p.d || !p.fill)) throw new Error(`Invalid vector: ${file}`);
  vectors[file.replace('.svg', '')] = { transform: group[1], paths };
}
const target = new URL('src/components/pdf/generated/operating-pattern-vectors.json', root);
writeFileSync(target, JSON.stringify(vectors) + '\n');
console.log(`Synced ${Object.keys(vectors).length} illustrations to ${fileURLToPath(target)}`);
