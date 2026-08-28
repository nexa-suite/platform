# Runtime mock mode

Platform mantiene `api` como modo por defecto y el perfil `generic` como perfil
por defecto. El mock sólo se activa cuando el host define explícitamente
`globalThis.__NEXA_RUNTIME_CONFIG__` antes de `bootstrapApplication`:

```html
<script>
  globalThis.__NEXA_RUNTIME_CONFIG__ = {
    dataMode: 'mock',
    tenantProfile: 'icisa'
  };
</script>
```

Para una prueba local, el bloque puede inyectarse temporalmente en el host que
sirve `index.html`, antes de `<app-root>`. No se debe dejar ese bloque en una
configuración compartida: un build sin esa variable conserva el comportamiento
API existente.

Como atajo local, también se puede abrir
`http://localhost:4200/sign-in?nexaDataMode=mock&nexaTenantProfile=icisa`. El
override por query sólo se acepta en `localhost`, `127.0.0.1` o `::1`.

## Perfiles demo

| Perfil | Workspace | Identificador | Contraseña |
|---|---|---|---|
| `generic` | `generic` | `demo@generic.nexa.test` | `NexaDemo123!` |
| `icisa` | `icisa` | `carlos@icisa.pe` | `NexaDemo123!` |

Las identidades, cuentas, catálogo, solicitudes, órdenes y direcciones son
fixtures deterministas de demostración. No son credenciales ni datos de
producción. El perfil ICISA reutiliza referencias a los assets catalogados en
`public/catalog-items/`.

## Corte soportado

Los providers seleccionan adaptadores mock dentro del bounded context dueño y
mantienen los mismos application ports que usa el modo `api`:

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

No se agregan rutas HTTP ni se modifica el contrato API. El estado mock vive en
memoria y se reinicia al recargar la página. Los gateways ACL existentes siguen
siendo los límites entre contextos; las composiciones consumen ports y no
importan clientes HTTP desde presentation.

El corte no pretende simular persistencia, autorización real, jobs, webhooks ni
la totalidad del backend de BC-11. El adapter mock permite validar navegación,
estados, errores de concurrencia y flujos de UI sin depender de servicios
externos.

Validación local esperada:

```bash
npm run validate:bounded-contexts
npm test
npm run build
```
