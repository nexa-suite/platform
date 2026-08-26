import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'src/app');
const contexts = [
  'tenantaccessgovernance', 'customerbuyerrelationships',
  'catalogcommercialpolicy', 'salescommitment',
  'inventoryavailability', 'fulfillmentdelivery',
  'creditreceivables', 'payments', 'businessdocuments',
  'notifications', 'businesstraceability'
];
const layers = ['application', 'domain', 'infrastructure', 'presentation'];
const BC01TechnicalSubcontexts = ['iam', 'tenantmanagement'];
const legacyRoots = [
  'bounded-contexts',
  'BC-01-tenant-access-governance', 'BC-02-customer-buyer-relationships',
  'BC-03-catalog-commercial-policy', 'BC-04-sales-commitment',
  'BC-05-inventory-availability', 'BC-06-fulfillment-delivery',
  'BC-07-credit-receivables', 'BC-08-payments', 'BC-09-business-documents',
  'BC-10-notifications', 'BC-11-business-traceability',
  'iam', 'tenant-management', 'tenantmanagement', 'customer-buyer-relationships',
  'catalog-management', 'sales-commitment', 'warehouse', 'logistics',
  'documents', 'business-documents', 'invoicing', 'core/audit', 'core/notifications'
];
const errors = [];

function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

function appRelative(path) {
  return normalize(relative(app, path));
}

function sourceFiles(dir) {
  return files(dir).filter((path) => path.endsWith('.ts'));
}

function requireDirectory(path, label) {
  if (!existsSync(path)) {
    errors.push(`missing required layer: ${label}`);
    return;
  }
  if (files(path).length === 0) errors.push(`empty required layer: ${label}`);
}

function contextLocation(path) {
  const parts = appRelative(path).split('/');
  if (!contexts.includes(parts[0])) return null;

  const context = parts[0];
  if (layers.includes(parts[1])) return { context, layer: parts[1], technicalSubcontext: null };
  if (context === contexts[0] && BC01TechnicalSubcontexts.includes(parts[1]) && layers.includes(parts[2])) {
    return { context, layer: parts[2], technicalSubcontext: parts[1] };
  }
  return { context, layer: null, technicalSubcontext: parts[1] ?? null };
}

function localImportTarget(file, modulePath) {
  return normalize(resolve(dirname(file), modulePath));
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function isCompositionFile(relativePath) {
  return relativePath === 'app.config.ts' || relativePath === 'app.routes.ts' || relativePath === 'main.ts' ||
    relativePath.startsWith('core/layout/') || relativePath.startsWith('core/presentation/');
}

function validateContextRoots() {
  for (const context of contexts) {
    const contextDir = join(app, context);
    if (!existsSync(contextDir)) {
      errors.push(`missing canonical context: ${context}`);
      continue;
    }

    const ownerFiles = files(contextDir);
    if (!existsSync(join(contextDir, 'README.md')) && !ownerFiles.some((path) => path.endsWith('.ts'))) {
      errors.push(`missing concrete owner marker: ${context}`);
    }

    for (const layer of layers) requireDirectory(join(contextDir, layer), `${context}/${layer}`);

    for (const entry of readdirSync(contextDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (layers.includes(entry.name)) continue;
      if (context === contexts[0] && BC01TechnicalSubcontexts.includes(entry.name)) continue;
      errors.push(`legacy or implicit root under ${context}: ${entry.name}`);
    }

    if (context !== contexts[0]) continue;
    for (const technicalSubcontext of BC01TechnicalSubcontexts) {
      const technicalDir = join(contextDir, technicalSubcontext);
      if (!existsSync(technicalDir)) {
        errors.push(`missing BC-01 API-equivalent subcontext: ${context}/${technicalSubcontext}`);
        continue;
      }
      for (const layer of layers) requireDirectory(join(technicalDir, layer), `${context}/${technicalSubcontext}/${layer}`);
      for (const entry of readdirSync(technicalDir, { withFileTypes: true })) {
        if (entry.isDirectory() && !layers.includes(entry.name)) {
          errors.push(`legacy or implicit root under ${context}/${technicalSubcontext}: ${entry.name}`);
        }
      }
    }
  }
}

function validateLegacyRoots() {
  for (const legacyRoot of legacyRoots) {
    if (existsSync(join(app, legacyRoot))) errors.push(`legacy root remains: src/app/${legacyRoot}`);
  }
}

function validateDependencies() {
  const importPattern = /(?:from\s*|import\s*\(\s*)(['"])(\.\.?\/[^'"]+)\1/g;
  const dependencyDirection = {
    domain: new Set(['domain']),
    application: new Set(['application', 'domain']),
    infrastructure: new Set(['infrastructure', 'application', 'domain']),
    presentation: new Set(['presentation', 'application', 'domain'])
  };

  for (const file of sourceFiles(app)) {
    const sourceLocation = contextLocation(file);
    if (!sourceLocation) continue;
    const sourceRelative = appRelative(file);
    const source = readFileSync(file, 'utf8');

    if (!sourceLocation.layer) {
      errors.push(`unclassified context source: ${sourceRelative}`);
      continue;
    }

    if (sourceLocation.layer === 'domain') {
      if (/from\s*['"]@(?:angular|ngx)-|from\s*['"]@angular\//.test(source) ||
        /\b(HttpClient|HttpHeaders|HttpParams|HttpRequest|HttpResponse|HttpErrorResponse|JDBC)\b/.test(source)) {
        errors.push(`domain imports framework/HTTP: ${sourceRelative}`);
      }
    }
    if (sourceLocation.layer === 'application' &&
      (/from\s*['"]@angular\/common\/http['"]/.test(source) ||
        /\b(HttpClient|HttpHeaders|HttpParams|HttpRequest|HttpResponse|HttpErrorResponse|JDBC)\b/.test(source))) {
      errors.push(`application imports HTTP/persistence infrastructure: ${sourceRelative}`);
    }

    for (const match of source.matchAll(importPattern)) {
      const target = localImportTarget(file, match[2]);
      const targetLocation = contextLocation(target);
      if (!targetLocation) continue;
      const targetRelative = appRelative(target);
      const line = lineNumber(source, match.index);

      if (sourceLocation.layer !== 'infrastructure' && /^core\/.*\/infrastructure\//.test(targetRelative)) {
        errors.push(`BC layer imports core infrastructure: ${sourceRelative}:${line} -> ${targetRelative}`);
      }

      if (targetLocation.context !== sourceLocation.context) {
        const explicitBoundary = sourceRelative === 'core/security/platform-authentication.boundary.ts' &&
          targetRelative.startsWith('tenantaccessgovernance/iam/') &&
          (targetRelative.includes('/application/authentication.service') || targetRelative.includes('/domain/models/auth.models'));
        const explicitComposition = isCompositionFile(sourceRelative);
        const explicitAcl = sourceLocation.layer === 'infrastructure' && targetLocation.layer === 'domain' && targetRelative.includes('/domain/ports/');
        if (!explicitBoundary && !explicitComposition && !explicitAcl) {
          errors.push(`illegal cross-BC dependency ${sourceRelative}:${line} -> ${targetRelative}`);
        }
        continue;
      }

      if (!targetLocation.layer) {
        errors.push(`unclassified local dependency ${sourceRelative}:${line} -> ${targetRelative}`);
        continue;
      }
      if (!dependencyDirection[sourceLocation.layer].has(targetLocation.layer)) {
        errors.push(`illegal layer dependency ${sourceRelative}:${line} (${sourceLocation.layer}) -> ${targetRelative} (${targetLocation.layer})`);
      }
    }

    if (/(controller)/i.test(sourceRelative) && sourceLocation.layer !== 'presentation') {
      errors.push(`controller outside presentation: ${sourceRelative}`);
    }
  }
}

validateContextRoots();
validateLegacyRoots();
validateDependencies();

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Bounded-context architecture PASS (${contexts.length} roots, direct layers, production/tests and dependency direction checked)`);
