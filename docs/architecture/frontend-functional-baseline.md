# Frontend functional baseline — Platform v0.14

Este documento fija el corte funcional del frontend. Blueprint es autoridad de
requisitos; este archivo no redefine dominio, estados ni contratos API.

## Alcance canónico

| Epic | US | Superficie | BC principal | Proyección Angular actual |
|---|---:|---|---|---|
| WEB-EPIC-01 | 001–006 | Website | BC-01 | Fuera de Platform |
| WEB-EPIC-02 | 007–015 | Platform | BC-01 | `tenant-management/*` |
| WEB-EPIC-03 | 016–024 | Platform | BC-01 | `iam/*`, guards y shell |
| WEB-EPIC-04 | 025–032 | Platform | BC-02 | `ops/commercial/client-accounts` |
| WEB-EPIC-05 | 033–042 | Platform | BC-03 | `ops/catalog/*`, `ops/product-catalog/*` |
| WEB-EPIC-06 | 043–049 | Portal | BC-03 + BC-04 | Fuera de Platform |
| WEB-EPIC-07 | 050–060 | Platform + Portal | BC-04 | `ops/commercial/purchase-requests/*` |
| WEB-EPIC-08 | 061–069 | Platform + Portal | BC-04 | `ops/commercial/sales-orders/*`, manual orders |
| WEB-EPIC-09 | 070–081 | Platform | BC-05 | `ops/operations/inventory/*`, warehouses |
| WEB-EPIC-10 | 082–089 | Platform | BC-06 | `ops/operations/fulfillment-readiness` |
| WEB-EPIC-11 | 090–103 | Platform + Portal | BC-06 | `ops/operations/dispatch-orders/*`, POD |
| WEB-EPIC-12 | 104–115 | Platform + Portal | BC-07 + BC-08 | `ops/finance/bank-transfers` |
| WEB-EPIC-13 | 116–122 | Platform + Portal | BC-09 | `ops/operations/business-documents` |
| WEB-EPIC-14 | 123–126 | Platform + Portal | BC-10 | shell/servicio de notificaciones |
| WEB-EPIC-15 | 127–133 | Platform + Portal | BC-11 | audit, analytics y change feed |

## Corte v0.14 ejecutable

1. BC-01: sign-in, sesión, seguridad y administración de workspace.
2. BC-02: clientes, cuentas y referencias usadas por ventas.
3. BC-03: catálogo operativo, gestión, precios y promociones.
4. BC-04: inbox de solicitudes, revisión, sales orders y orden manual.
5. BC-05/BC-06: inventario, reservas, readiness, despacho y entrega.
6. BC-07/BC-08: transferencias bancarias y revisión de pagos.
7. BC-09/BC-10: documentos, evidencia y notificaciones.
8. BC-11: auditoría y change-feed offline no-op.

La semilla mock debe soportar dos perfiles explícitos: `generic` e `icisa`.
`api` es el modo por defecto; ningún build de producción puede depender del
mock. La selección vive en configuración runtime, no en `domain`.

## Reglas de implementación

- Cada BC conserva `domain`, `application`, `infrastructure` y `presentation`.
- Un mock es un adaptador de `application` ubicado en la `infrastructure` del
  BC dueño; no es un servicio global ni un segundo dominio.
- Las composiciones de superficie pueden conectar varios BC mediante ports,
  pero no importan clientes HTTP concretos desde `presentation`.
- Los nombres de URL existentes se conservan mientras formen parte de un
  contrato de navegación; no son nombres de bounded context.

Fuente: `blueprint/02-web/requirements/coverage.md`, Blueprint v1 CONFIRMED.
