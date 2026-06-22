# Guía de contribución y decisiones de arquitectura

Este documento registra las decisiones técnicas tomadas durante el desarrollo, los bugs conocidos, y el backlog de mejoras. Es la referencia para cualquier desarrollador que quiera extender o contribuir al proyecto.

---

## Decisiones de arquitectura

### Por que SQLite y no PostgreSQL / MySQL

**Contexto:** La plataforma actua como capa de integración delante de Odoo, no como sistema de registro. Los datos críticos de negocio viven en Odoo; la plataforma solo necesita persistir usuarios locales, roles, logs de sincronización y una cache pequeña de datos de referencia.

**Decision:** SQLite con TypeORM + `better-sqlite3`.

**Ventajas en este caso:**
- Cero configuración de servidor: el archivo se crea en el primer arranque
- Latencia de lectura local mínima (ideal para cache de referencia)
- Suficiente para el volumen de datos de la plataforma (usuarios locales + logs)
- Portabilidad total: el repo funciona sin infraestructura adicional

**Tradeoff aceptado:** No escala a múltiples instancias del backend en paralelo. Si el sistema crece a múltiples nodos, migrar a PostgreSQL con TypeORM Migrations sería el siguiente paso natural.

---

### Por que `xmlrpc` y no la REST API de Odoo

**Contexto:** Odoo expone dos APIs: XML-RPC (estable desde Odoo 6, no requiere token OAuth) y una REST API (introducida en Odoo 17, aun limitada en cobertura de modelos).

**Decision:** `xmlrpc` 1.3.2 para todas las operaciones de negocio.

**Razones:**
- XML-RPC es la API canónica documentada y compatible con Odoo 14, 15, 16 y 17
- Autenticación simple con API key (sin flujo OAuth)
- Acceso completo a `execute_kw` que permite `search_read`, `create`, `write`, y llamadas a métodos de negocio (wizards, confirmaciones)
- La REST API de Odoo 17+ no cubre aun todos los modelos y métodos que usa la plataforma

**Tradeoff aceptado:** XML-RPC es verboso y su manejo de errores mezcla faults XML con errores HTTP. El cliente `OdooClient` implementa reintentos con backoff y detección de errores de negocio para mitigarlo.

---

### Por que fallback HTTP para PDFs en lugar de `/xmlrpc/2/report`

**Contexto:** Odoo expone `/xmlrpc/2/report` para generar PDFs vía XML-RPC. En instancias SaaS y trial de Odoo, este endpoint está deshabilitado o redirige a un error HTML. El método `_render_qweb_pdf` también está marcado como privado y bloqueado.

**Decision:** Implementar un fallback HTTP que autentica una sesión web de Odoo y descarga el PDF via `/report/pdf/{reportName}/{id}?download=true`.

**Flujo del fallback:**
1. `POST /web/session/authenticate` con `ODOO_USERNAME` + `ODOO_WEB_PASSWORD`
2. Almacenar la cookie de sesión en memoria (`webSessionCookie`)
3. `GET /report/pdf/{reportName}/{id}?download=true` con la cookie
4. Si el servidor devuelve 401/403, refrescar la sesión y reintentar una vez

**Por que `ODOO_WEB_PASSWORD` es separada de `ODOO_API_KEY`:** La autenticación XML-RPC usa la API key como credencial. La sesión web de Odoo requiere la contraseña real del usuario (no acepta API keys). Son dos mecanismos de autenticación distintos en Odoo.

---

## Bugs conocidos

### Bug critico: `createInvoice` falla con productos sin entrega

**Descripcion:** Al llamar `POST /api/sales/:id/invoice`, el backend ejecuta el wizard `sale.advance.payment.inv` con `advance_payment_method = 'delivered'`. Este metodo exige que las lineas del pedido tengan cantidades entregadas (`qty_delivered > 0`) registradas en Odoo.

**Sintoma:** Odoo devuelve:
```
No se puede crear una factura pues no hay artículos disponibles para facturar.
```

**Causa raiz:** La politica `delivered` es correcta para empresas con flujo de almacen completo. En un contexto POS o de servicios, la politica apropiada es `order` (facturar por cantidades ordenadas, sin requerir entrega).

**Ubicacion:** `src/sales/sales.service.ts` — metodo `createInvoice`.

**Solucion pendiente:**
1. Antes de llamar al wizard, consultar `invoice_status`, `qty_delivered`, y `product_id.invoice_policy` por cada linea del pedido.
2. Si todas las lineas son facturables por cantidad ordenada, usar `advance_payment_method = 'fixed'` o cambiar la politica directamente.
3. Si alguna linea bloquea, devolver un error descriptivo al frontend en lugar del mensaje crudo de Odoo.

---

### Campos variables por instancia Odoo

**Descripcion:** El campo `res.partner.mobile` no existe en todas las instancias de Odoo (depende de modulos instalados). Consultarlo directamente en `searchRead` causa un error XML-RPC.

**Solucion aplicada:** El campo `mobile` fue eliminado de las queries de contactos/clientes/proveedores.

**Problema de fondo:** No hay ningun mecanismo para descubrir dinamicamente que campos existen en una instancia antes de consultarlos.

**Solucion pendiente:** Implementar `fields_get(model, [])` al inicializar `OdooClient` para cachear los campos disponibles por modelo. Antes de cada `searchRead`, filtrar los campos solicitados contra los disponibles en la instancia.

---

### Errores intermitentes `Unknown XML-RPC tag 'TITLE'`

**Descripcion:** En algunas llamadas, Odoo devuelve una pagina HTML en lugar de una respuesta XML valida. El parser de `xmlrpc` lanza `Unknown XML-RPC tag 'TITLE'`.

**Causa:** El servidor Odoo SaaS redirige ciertas rutas a una pagina de error o mantenimiento. Ocurre mas frecuentemente en instancias trial con limite de llamadas.

**Estado:** El `OdooClient` detecta el error y lo relanza con un mensaje descriptivo, pero no categoriza la causa (sesion expirada, rate limit, mantenimiento, etc.).

**Solucion pendiente:** Parsear el HTML recibido para detectar tipo de error (401, 503, pagina de mantenimiento) y ajustar el mensaje de error y la estrategia de reintento segun el caso.

---

## Como agregar un nuevo modulo Odoo

El patron establecido en el proyecto es **service → controller → module → app.module.ts**. Los pasos para integrar un nuevo modelo de Odoo (por ejemplo `account.move`):

### 1. Crear el servicio

```typescript
// src/invoices/invoices.service.ts
import { Injectable } from '@nestjs/common';
import { OdooClient } from '../odoo/odoo.client';

@Injectable()
export class InvoicesService {
  constructor(private odoo: OdooClient) {}

  async findAll(limit = 40, offset = 0) {
    return this.odoo.searchRead(
      'account.move',
      [['move_type', '=', 'out_invoice']],
      ['id', 'name', 'partner_id', 'amount_total', 'state', 'invoice_date'],
      limit,
      offset,
    );
  }
}
```

### 2. Crear el controller

```typescript
// src/invoices/invoices.controller.ts
import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  findAll(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.invoicesService.findAll(limit ?? 40, offset ?? 0);
  }
}
```

### 3. Crear el modulo

```typescript
// src/invoices/invoices.module.ts
import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { OdooModule } from '../odoo/odoo.module';

@Module({
  imports: [OdooModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
```

### 4. Registrar en AppModule

```typescript
// src/app.module.ts
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [
    // ... otros modulos existentes
    InvoicesModule,
  ],
})
export class AppModule {}
```

### Notas del patron

- `OdooClient` esta provisto por `OdooModule` que exporta el cliente. Importar `OdooModule` en cada modulo hijo es la forma correcta (no inyectarlo globalmente).
- Usar `RolesGuard` + `@Roles(...)` para restringir endpoints segun el rol del usuario.
- Para operaciones de escritura en Odoo, siempre validar el estado del recurso antes de llamar metodos de negocio (ej: verificar `state` antes de confirmar o facturar).

---

## Backlog de mejoras

> Migrado desde `NEXT_STEPS.md`. Ordenado por impacto.

### Critico / Bloqueante

- **Corregir `createInvoice`:** soportar la politica `ordered` como alternativa a `delivered`. Validar `invoice_status` y `qty_delivered` antes del wizard. Mostrar mensaje de error descriptivo en el frontend.

### Alta prioridad

- **Descubrimiento dinamico de campos (`fields_get`):** consultar los campos disponibles por modelo al inicializar `OdooClient` y filtrar las queries contra ese inventario. Evita roturas al conectar con instancias con modulos diferentes.
- **Categorizacion de errores RPC:** distinguir entre errores de sesion, errores de negocio, respuestas HTML inesperadas, y rate limits. Adaptar mensajes al usuario y estrategia de reintento segun tipo.
- **Internacionalizar la UI:** los textos del frontend estan hardcodeados en español en `src/config/branding.ts` y en los componentes. Migrar a una libreria i18n (ej. `react-i18next`) para soportar multiples idiomas.

### Media prioridad

- **Branding dinamico:** los valores de `companyName`, `platformName`, y `logoUrl` en `src/config/branding.ts` son constantes. Moverlos a variables de entorno Vite (`VITE_*`) o a un endpoint de configuracion del backend.
- **Mensajes de error en el frontend para facturacion:** cuando `createInvoice` falla, mostrar al usuario si el problema es falta de entrega, politica de producto incompatible, o error de conexion con Odoo.
- **Migraciones TypeORM:** reemplazar `synchronize: true` con migraciones explícitas para produccion. `synchronize: true` puede alterar o eliminar columnas al detectar cambios en entidades, sin control de versiones.
- **Wiring de `ODOO_SYNC_INTERVAL_MINUTES`:** la variable se parsea en config pero `@Cron` esta hardcodeado a `EVERY_5_MINUTES`. Implementar un scheduler dinamico o eliminar la variable para evitar confusión.

### Baja prioridad / Calidad

- **Cobertura de tests:** agregar tests unitarios para `OdooClient` (mockear `xmlrpc`), `AuthService`, `SyncService`, y los DTOs de validacion.
- **Swagger / OpenAPI:** agregar `@nestjs/swagger` para generar documentacion interactiva de la API automaticamente.
- **Dockerizacion:** crear `Dockerfile` para backend y `docker-compose.yml` para levantar la plataforma completa con un solo comando.
- **Endpoint de health sin autenticacion:** el unico health check (`GET /api/health/odoo`) requiere JWT y rol `admin`. Para monitoreo de infraestructura se necesita un endpoint anonimo que confirme que el proceso esta vivo.
- **Logs estructurados:** reemplazar el `Logger` de NestJS por un logger estructurado (ej. `pino`) para facilitar el analisis en produccion.
