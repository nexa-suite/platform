import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const platformRoot = new URL('../', import.meta.url);
const sourceRoot = process.env.NEXA_DESIGN_LAB_REPO
  ? pathToFileURL(`${process.env.NEXA_DESIGN_LAB_REPO.replace(/\/$/, '')}/`)
  : new URL('../../design-lab/', import.meta.url);
const tokenFiles = [
  '_tokens-primitives.scss',
  '_tokens-semantic.scss',
  '_tokens-components.scss',
  '_tokens-data-visualization.scss'
];
const requiredTokensByFile = {
  '_tokens-components.scss': ['--nexa-target-size-min: 44px'],
  '_tokens-semantic.scss': [
    '--nexa-color-info-standard-background',
    '--nexa-color-success-emphasized-background',
    '--nexa-color-neutral-standard-background'
  ]
};

const readPlatform = (relativePath) => readFileSync(new URL(relativePath, platformRoot), 'utf8');
const manifest = JSON.parse(readPlatform('public/assets/branding/design-lab-source.json'));

if (manifest.source !== 'nexa-design-lab' || manifest.version !== '1.0.2' || manifest.ref !== 'main') {
  throw new Error('Design Lab branding provenance is invalid');
}

for (const [name, asset] of Object.entries(manifest.assets)) {
  const bytes = readPlatform(`public/${asset.path}`);
  const sha1 = createHash('sha1').update(bytes).digest('hex');
  if (sha1 !== asset.sha1) throw new Error(`Brand asset checksum mismatch: ${name}`);
}

for (const tokenFile of tokenFiles) {
  const local = readPlatform(`src/styles/${tokenFile}`);
  if (!local.includes('Generated from tokens/')) throw new Error(`Token artifact is not generated: ${tokenFile}`);
  for (const token of requiredTokensByFile[tokenFile] ?? []) {
    if (!local.includes(token)) throw new Error(`Missing official token ${token} in ${tokenFile}`);
  }
  const sourceFile = new URL(`src/styles/${tokenFile}`, sourceRoot);
  if (existsSync(sourceFile) && local !== readFileSync(sourceFile, 'utf8')) {
    throw new Error(`Token artifact drift from Design Lab: ${tokenFile}`);
  }
}

console.log(JSON.stringify({ source: manifest.source, version: manifest.version, commit: manifest.commit, tokenFiles, sourceChecked: tokenFiles.every((file) => existsSync(new URL(`src/styles/${file}`, sourceRoot))) }, null, 2));
