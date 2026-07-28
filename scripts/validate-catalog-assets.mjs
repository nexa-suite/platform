import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const expectedSeed = 'c9fdb629c3996f78918081a6e7f6598ce44c8ede05a8208c7f77785367ca096b';
const root = new URL('../public/catalog-items/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('catalog-assets.manifest.json', root), 'utf8'));
const assets = manifest.assets;
const imagePattern = /^[a-z0-9][a-z0-9.-]*\.(?:png|jpe?g|webp)$/;
if (manifest.version !== 1 || manifest.seedSha256 !== expectedSeed || manifest.assetCount !== 50 || !Array.isArray(assets) || assets.length !== 50) throw new Error('Catalog asset manifest metadata is invalid');
const names = assets.map((asset) => asset.fileName);
if (new Set(names).size !== 50 || names.some((name) => !imagePattern.test(name) || name.includes('..'))) throw new Error('Catalog asset names are unsafe or duplicated');
const files = readdirSync(root).filter((name) => imagePattern.test(name));
if (files.length !== 50 || files.some((name) => !names.includes(name))) throw new Error('Catalog asset directory does not match the manifest');
let total = 0; let smallest = Number.POSITIVE_INFINITY; let largest = 0;
for (const asset of assets) {
  const file = new URL(asset.fileName, root);
  if (!existsSync(file)) throw new Error(`Missing catalog asset: ${asset.fileName}`);
  const bytes = readFileSync(file); const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== asset.sha256) throw new Error(`Catalog asset checksum mismatch: ${asset.fileName}`);
  const size = statSync(file).size; total += size; smallest = Math.min(smallest, size); largest = Math.max(largest, size);
}
console.log(JSON.stringify({ assetCount: assets.length, totalMediaBytes: total, smallestBytes: smallest, largestBytes: largest }, null, 2));
