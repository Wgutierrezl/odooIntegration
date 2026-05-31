# Integration Odoo — Estado actual y pendientes

## 1) Prioridad máxima (bloqueante)

## ✅ Arreglar facturación (descarga + creación)

### Situación actual
- Ya se resolvió el bloqueo de descarga por XML-RPC report en parte del flujo:
  - `/xmlrpc/2/report` no está disponible en esta instancia (SaaS/trial)
  - `_render_qweb_pdf` está bloqueado por ser método privado
  - Se implementó fallback por sesión HTTP (`/web/session/authenticate` + `/report/pdf/...`)

### Bloqueo actual crítico
- Al crear facturas aparece:
  - `No se puede crear una factura pues no hay artículos disponibles para facturar.`
- Causa: el backend usa `advance_payment_method = delivered`.
- En Odoo, esto exige cantidades entregadas para facturar.

### Acción requerida (prioridad 1)
1. Ajustar el flujo de `createInvoice` para POS:
   - intentar con política compatible con facturación por cantidades ordenadas (cuando aplique), o
   - fallback automático cuando `delivered` falle por líneas no facturables.
2. Validar en backend antes de llamar wizard:
   - revisar `invoice_status`, `qty_delivered`, `qty_invoiced`.
3. Mostrar error funcional claro en frontend:
   - explicar al usuario si falta entrega o si política de producto impide facturar.

---

## 2) Hallazgos y faltantes importantes

### Compatibilidad con instancia Odoo
- Esta instancia tiene restricciones SaaS/custom (servicios RPC no estándar).
- Recomendación:
  - evitar depender de métodos privados o servicios opcionales de XML-RPC.
  - centralizar fallback HTTP para reportes.

### Campos variables por instancia
- `res.partner.mobile` no existe en este entorno y rompía Clientes/Proveedores.
- Recomendación:
  - implementar descubrimiento dinámico de campos (`fields_get`) para evitar caídas por campos inválidos.

### Manejo de errores RPC
- Se observan errores intermitentes tipo `Unknown XML-RPC tag 'TITLE'` (respuesta HTML en lugar de XML válido).
- Recomendación:
  - robustecer manejo de errores y logging por etapas:
    - auth/session
    - rpc business error
    - html/unexpected response

---

## 3) Progreso implementado

## Backend
- Confirmación de venta idempotente antes de facturar.
- Fallback de descarga PDF por sesión HTTP.
- Ampliación de campos de ventas/productos/contactos/dashboard.
- Fix de `customers/suppliers` retirando campo no soportado (`mobile`).

## Frontend
- UI principal en español (navegación y vistas clave).
- Branding base aplicado:
  - logo corporativo
  - nombre de empresa/plataforma
  - título del navegador
- Vistas enriquecidas con más datos de Odoo.

---

## 4) Plan sugerido (orden recomendado)

1. **Facturación (crítico)**
   - corregir `createInvoice` para no depender solo de `delivered`.
   - validar casos con productos almacenables/consumibles/servicios.

2. **Observabilidad y UX de errores**
   - mensajes claros en frontend para causas de facturación.
   - logs estructurados para soporte técnico.

3. **Compatibilidad dinámica de campos**
   - `fields_get` por modelo (`res.partner`, `sale.order`, etc.).

4. **Internacionalización y branding completo**
   - externalizar textos a i18n real (ES/EN).
   - tematización de colores corporativos.

---

## 5) Checklist de validación para facturas (cuando se implemente el fix)

- [ ] Crear venta con producto facturable por cantidad ordenada.
- [ ] Crear venta con producto que exige entrega y validar mensaje esperado.
- [ ] Crear factura desde orden `sale` sin re-confirmación innecesaria.
- [ ] Descargar PDF de factura desde frontend (flujo HTTP report).
- [ ] Verificar nombre de archivo y contenido PDF correcto.

