# Test-only fixture adapters

Platform usa API en todo runtime de navegador. No existe un interruptor de mock
para la aplicación desplegada; `nexaDataMode=mock`, storage local y globals son
ignorados. Los dobles permanecen en pruebas unitarias aisladas.

Para validar la interfaz contra datos reales, inicia sesión con una identidad
IAM válida y usa la API desplegada. Si backend no responde, Platform muestra
estado de error; no sustituye respuesta con fixtures.

## Perfiles demo

| Perfil | Workspace | Identificador | Contraseña |
|---|---|---|---|
| `generic` | `generic` | `demo@generic.nexa.test` | `NexaDemo123!` |
| `icisa` | `icisa` | `carlos@icisa.pe` | `NexaDemo123!` |

Las identidades de fixtures son históricas y no funcionan en runtime API-only.
Los datos mostrados en producción provienen del workspace autenticado. Assets
de catálogo siguen siendo recursos visuales locales, no sustitutos de registros
del API.

La navegación por rol depende ahora de claims/permisos emitidos por API. El
alias visual `Dispatch` representa rol contractual `LOGISTICS`; no existe rol
BOM aceptado por backend.

| Persona local | `nexaDemoRole` | Rol de contrato | Identificador ICISA |
|---|---|---|---|
| Sales | `sales` | `SALES` | `carlos@icisa.pe` |
| Warehouse | `warehouse` | `WAREHOUSE` | `warehouse@icisa.pe` |
| Dispatch | `dispatch` | `LOGISTICS` | `dispatch@icisa.pe` |
| Company Owner | `company-owner` | `COMPANY_OWNER` | `company-owner@icisa.pe` |
| Tenant Admin | `tenant-admin` | `TENANT_ADMIN` | `tenant-admin@icisa.pe` |

Las contraseñas de la tabla anterior son datos de fixtures, no credenciales
reales. No se deben usar para certificar autorización o tenant isolation.

## Corte de pruebas

Los adaptadores mock conservan los mismos application ports para pruebas
unitarias aisladas. Runtime navegador no los selecciona:

- BC-01 Tenant Access & Governance: IAM, seguridad de perfil y administración
  de organización/workspace.
- BC-02 Customer & Buyer Relationships: clientes, cuentas y direcciones usadas
  por las composiciones comerciales.
- BC-03 Catalog & Commercial Policy: catálogo operativo, gestión de catálogo,
  precios, promociones y targets buyer-safe.
- BC-04 Sales Commitment: purchase requests, revisión, sales orders y orden
  manual.
- BC-05 Inventory & Availability: almacenes, zonas, lotes, movimientos,
  reservas, disponibilidad y readiness.
- BC-06 Fulfillment & Delivery: dispatch orders, asignación, ruta,
  temperatura, incidentes, reprogramación, POD y analítica operativa.
- BC-07 Credit & Receivables y BC-08 Payments: revisión de transferencias
  bancarias y estados deterministas de pago.
- BC-09 Business Documents: generación, regeneración, descarga y evidencia.
- BC-10 Notifications: feed y estado de lectura.
- BC-11 Business Traceability: auditoría local y change-feed no-op para la
  demo offline.

No se agregan rutas HTTP ni se modifica el contrato API. Los gateways ACL
existentes siguen siendo los límites entre contextos; las composiciones
consumen ports y no importan clientes HTTP desde presentation.

El corte de pruebas no pretende simular persistencia, autorización real, jobs,
webhooks ni totalidad del backend de BC-11. No sirve para certificar runtime,
autorización, tenant isolation o conexión API.

Validación local esperada:

```bash
npm run validate:bounded-contexts
npm test
npm run build
```
