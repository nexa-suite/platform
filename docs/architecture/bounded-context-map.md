# Platform — mapa frontend de bounded contexts

Fuente canónica: [Blueprint bounded contexts](https://github.com/nexa-suite/blueprint/tree/main/01-shared/domain/bounded-contexts). Este mapa sólo describe la proyección de la superficie Platform; no sustituye los READMEs canónicos ni convierte una ruta Angular en autoridad de dominio.

| BC | Ubicación frontend | Estado / responsabilidad de superficie |
|---|---|---|
| BC-01 Tenant & Access Governance | `src/app/tenantaccessgovernance` | Implementado: IAM, tenant/workforce y auditoría de seguridad |
| BC-02 Customer & Buyer Relationships | `src/app/customerbuyerrelationships` | Implementado: cuentas cliente y relaciones |
| BC-03 Catalog & Commercial Policy | `src/app/catalogcommercialpolicy` | Implementado: gestión de catálogo y política comercial |
| BC-04 Sales Commitment | `src/app/salescommitment` | Implementado: compromisos, solicitudes, órdenes y dashboard comercial |
| BC-05 Inventory Availability | `src/app/inventoryavailability` | Implementado: almacén, lotes, disponibilidad y reservas |
| BC-06 Fulfillment & Delivery | `src/app/fulfillmentdelivery` | Implementado: despacho, entrega, POD e incidencias |
| BC-07 Credit & Receivables | `src/app/creditreceivables` | Reservado: sin implementación frontend actual |
| BC-08 Payments | `src/app/payments` | Implementado: pagos, transferencias y revisión de pagos |
| BC-09 Business Documents | `src/app/businessdocuments` | Implementado: documentos de negocio |
| BC-10 Notifications | `src/app/notifications` | Implementado: notificaciones de Platform |
| BC-11 Business Traceability | `src/app/businesstraceability` | Reservado: sin implementación frontend actual |

`core` contiene composición de superficie, routing, seguridad transversal y layout; `shared` contiene componentes/utilidades compartidos. Un cruce de contextos se realiza mediante composición o un gateway/ACL explícito, sin importar el `domain`, `application` o `presentation` de otro BC.

Los BCs consumen el change-feed mediante `core/change-feed/application/change-feed.service.ts`; el cliente SSE concreto queda encapsulado en `core/change-feed/infrastructure` y no se importa desde una capa del BC.

Los roots de código usan exactamente los nombres de módulos API y viven directamente bajo `src/app`: `tenantaccessgovernance`, `customerbuyerrelationships`, `catalogcommercialpolicy`, `salescommitment`, `inventoryavailability`, `fulfillmentdelivery`, `creditreceivables`, `payments`, `businessdocuments`, `notifications` y `businesstraceability`. Los identificadores `BC-01` a `BC-11` se conservan aquí únicamente como IDs canónicos de Blueprint. BC-01 mantiene `iam` y `tenantmanagement` como módulos técnicos, cada uno con sus cuatro capas.

La dependencia acotada de `AuthenticationService` desde superficies de workforce es la capacidad upstream de autorización de BC-01, no una importación de modelo de negocio.
