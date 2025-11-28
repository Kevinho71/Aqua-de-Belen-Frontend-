# 📋 Guía de Integración Frontend - API de Inventario y Análisis

## 🎯 Resumen
Esta guía documenta todos los endpoints disponibles para el módulo de inventario, análisis ABC, pedidos automáticos y consolidación de compras.

---

## 📡 Endpoints Disponibles

### 1️⃣ Exportación de Inventario (Excel)

**Endpoint:** `GET /api/v1/inventario/export/excel`

**Descripción:** Genera y descarga un archivo Excel con el inventario completo para revisión física.

**Request:**
- **Método:** GET
- **Headers:** 
  ```
  Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  Authorization: Bearer {token}  (si JWT habilitado)
  ```
- **Parámetros:** Ninguno

**Response:**
- **Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition:** `attachment; filename="Inventario_Continuo_YYYYMMDD_HHMMSS.xlsx"`
- **Body:** Archivo binario (Excel)

**Estructura del Excel:**

| Columna | Tipo | Ejemplo |
|---------|------|---------|
| ID | Integer | 1 |
| Nombre Producto | String | Chanel No 5 |
| Tipo de Producto | String | Perfumes |
| Descripción | String | El clásico atemporal... |
| Stock Actual | Double | 125.0 |
| Último Precio | Currency | Bs 1,400.00 |
| Fecha Precio | DateTime | 15/01/2025 10:00 |
| Estado | String | ACTIVO / DESCONTINUADO |

---

### 2️⃣ KPIs de Inventario (ABC, EOQ, ROP)

**Endpoint:** `GET /api/v1/dashboard/inventory-kpis`

**Descripción:** Retorna métricas calculadas dinámicamente: clasificación ABC, EOQ, ROP y estado de reposición.

**Request:**
- **Método:** GET
- **Headers:** 
  ```
  Accept: application/json
  Authorization: Bearer {token}  (si JWT habilitado)
  ```
- **Parámetros:** Ninguno

**Response:**
- **Content-Type:** `application/json`
- **Status Code:** 200 OK

**Body de Respuesta:**
```json
[
  {
    "productoId": 1,
    "nombreProducto": "Chanel No 5",
    "clasificacionABC": "A",
    "eoq": 150,
    "puntoReorden": 80,
    "stockActual": 45.0,
    "estadoReposicion": "REORDENAR"
  },
  {
    "productoId": 2,
    "nombreProducto": "Dior Sauvage",
    "clasificacionABC": "B",
    "eoq": 100,
    "puntoReorden": 50,
    "stockActual": 75.0,
    "estadoReposicion": "OK"
  }
]
```

**Nota:** Cada objeto tiene un método `recomendacion()` que retorna:
- **A** → "Revisión Continua (Sistema Q) - Control estricto, monitoreo diario"
- **B** → "Revisión Periódica (Sistema P) - Control moderado, revisión semanal"
- **C** → "Compras Económicas - Lotes grandes, revisión mensual"

---

### 3️⃣ Alertas de Punto de Reorden (ROP)

**Endpoint:** `GET /api/v1/dashboard/alertas-rop`

**Descripción:** Filtra solo productos que necesitan reorden inmediato (stock ≤ ROP).

**Request:**
- **Método:** GET
- **Headers:** 
  ```
  Accept: application/json
  Authorization: Bearer {token}
  ```
- **Parámetros:** Ninguno

**Response:**
- **Content-Type:** `application/json`
- **Status Code:** 200 OK

**Body de Respuesta:**
```json
[
  {
    "productoId": 1,
    "nombreProducto": "Chanel No 5",
    "clasificacionABC": "A",
    "eoq": 150,
    "puntoReorden": 80,
    "stockActual": 45.0,
    "estadoReposicion": "REORDENAR"
  },
  {
    "productoId": 5,
    "nombreProducto": "Carolina Herrera Good Girl",
    "clasificacionABC": "A",
    "eoq": 120,
    "puntoReorden": 60,
    "stockActual": 30.0,
    "estadoReposicion": "REORDENAR"
  }
]
```

---

### 4️⃣ Pedidos Sugeridos Automáticos

#### 4.1 Listar Todos los Pedidos Sugeridos

**Endpoint:** `GET /api/v1/pedidos-sugeridos`

**Request:**
- **Método:** GET
- **Headers:** `Accept: application/json`

**Response:**
```json
[
  {
    "id": 1,
    "productoId": 1,
    "productoNombre": "Chanel No 5",
    "cantidadSugerida": 150,
    "fechaSugerida": "2025-11-26",
    "estado": "PENDIENTE",
    "observacion": "Pedido automático generado. Stock actual: 45.00 | ROP: 80 | Clasificación: A",
    "stockActualMomento": 45.0,
    "ropMomento": 80
  },
  {
    "id": 2,
    "productoId": 5,
    "productoNombre": "Dior Sauvage",
    "cantidadSugerida": 100,
    "fechaSugerida": "2025-11-26",
    "estado": "PENDIENTE",
    "observacion": "Pedido automático generado. Stock actual: 30.00 | ROP: 50 | Clasificación: B",
    "stockActualMomento": 30.0,
    "ropMomento": 50
  }
]
```

---

#### 4.2 Listar Pedidos por Estado

**Endpoint:** `GET /api/v1/pedidos-sugeridos/estado/{estado}`

**Parámetros de Ruta:**
- `estado`: PENDIENTE | APROBADO | RECHAZADO | EJECUTADO

**Ejemplos:**
```
GET /api/v1/pedidos-sugeridos/estado/PENDIENTE
GET /api/v1/pedidos-sugeridos/estado/APROBADO
```

**Response:** Mismo formato que 4.1

---

#### 4.3 Listar Pedidos por Producto

**Endpoint:** `GET /api/v1/pedidos-sugeridos/producto/{productoId}`

**Parámetros de Ruta:**
- `productoId`: Integer (ID del producto)

**Ejemplo:**
```
GET /api/v1/pedidos-sugeridos/producto/1
```

**Response:** Mismo formato que 4.1

---

#### 4.4 Obtener Pedido por ID

**Endpoint:** `GET /api/v1/pedidos-sugeridos/{id}`

**Ejemplo:**
```
GET /api/v1/pedidos-sugeridos/1
```

**Response:**
```json
{
  "id": 1,
  "productoId": 1,
  "productoNombre": "Chanel No 5",
  "cantidadSugerida": 150,
  "fechaSugerida": "2025-11-26",
  "estado": "PENDIENTE",
  "observacion": "Pedido automático generado. Stock actual: 45.00 | ROP: 80 | Clasificación: A",
  "stockActualMomento": 45.0,
  "ropMomento": 80
}
```

**Status Code 404** si no existe el ID.

---

#### 4.5 Actualizar Estado de Pedido

**Endpoint:** `PATCH /api/v1/pedidos-sugeridos/{id}/estado`

**Parámetros de Query:**
- `estado`: PENDIENTE | APROBADO | RECHAZADO | EJECUTADO

**Ejemplo:**
```
PATCH /api/v1/pedidos-sugeridos/1/estado?estado=APROBADO
```

**Response:**
```json
{
  "id": 1,
  "productoId": 1,
  "productoNombre": "Chanel No 5",
  "cantidadSugerida": 150,
  "fechaSugerida": "2025-11-26",
  "estado": "APROBADO",
  "observacion": "Pedido automático generado. Stock actual: 45.00 | ROP: 80 | Clasificación: A",
  "stockActualMomento": 45.0,
  "ropMomento": 80
}
```

---

#### 4.6 Generar Pedidos Manualmente (Testing)

**Endpoint:** `GET /api/v1/pedidos-sugeridos/generar-ahora`

**Descripción:** Ejecuta el proceso de generación de pedidos sin esperar al cron diario (8:00 AM).

**Request:**
```
GET /api/v1/pedidos-sugeridos/generar-ahora
```

**Response:**
```
Status: 200 OK
Content-Type: text/plain
Body: "Se generaron 3 pedidos sugeridos"
```

---

### 5️⃣ Aglomeración de Pedidos por Proveedor

**Endpoint:** `GET /api/v1/dashboard/aglomeracion`

**Descripción:** Agrupa pedidos sugeridos PENDIENTES por proveedor y calcula el ahorro por consolidación (Principio de Aglomeración).

**Request:**
- **Método:** GET
- **Headers:** `Accept: application/json`

**Response:**
```json
{
  "consolidados": [
    {
      "proveedorId": 1,
      "proveedorNombre": "Distribuidora Internacional S.A.",
      "cantidadPedidos": 3,
      "productos": [
        {
          "productoId": 1,
          "productoNombre": "Chanel No 5",
          "cantidadSugerida": 150,
          "stockActual": 45.0,
          "rop": 80
        },
        {
          "productoId": 5,
          "productoNombre": "Dior Sauvage",
          "cantidadSugerida": 100,
          "stockActual": 30.0,
          "rop": 50
        },
        {
          "productoId": 12,
          "productoNombre": "Carolina Herrera Good Girl",
          "cantidadSugerida": 120,
          "stockActual": 25.0,
          "rop": 60
        }
      ],
      "ahorro": {
        "costoSeparado": 1500.0,
        "costoConsolidado": 500.0,
        "ahorro": 1000.0,
        "porcentajeAhorro": 66.67
      }
    },
    {
      "proveedorId": 2,
      "proveedorNombre": "Perfumes Premium Ltda.",
      "cantidadPedidos": 2,
      "productos": [
        {
          "productoId": 8,
          "productoNombre": "Versace Eros",
          "cantidadSugerida": 80,
          "stockActual": 20.0,
          "rop": 40
        },
        {
          "productoId": 15,
          "productoNombre": "Paco Rabanne 1 Million",
          "cantidadSugerida": 90,
          "stockActual": 15.0,
          "rop": 35
        }
      ],
      "ahorro": {
        "costoSeparado": 1000.0,
        "costoConsolidado": 500.0,
        "ahorro": 500.0,
        "porcentajeAhorro": 50.0
      }
    }
  ],
  "ahorroTotalEstimado": 1500.0,
  "totalProveedores": 2,
  "totalPedidosPendientes": 5
}
```

**Interpretación:**
- **costoSeparado**: Costo de hacer N pedidos individuales (N × costo_pedido)
- **costoConsolidado**: Costo de 1 pedido consolidado (1 × costo_pedido)
- **ahorro**: Diferencia entre ambos escenarios
- **porcentajeAhorro**: (ahorro / costoSeparado) × 100

---

## 🔄 Flujo de Trabajo Recomendado

### Dashboard Principal
1. **GET** `/api/v1/dashboard/inventory-kpis` → Mostrar tabla de productos con clasificación ABC
2. Mostrar badge rojo si `estadoReposicion === "REORDENAR"`
3. Usar campo `recomendacion()` para tooltip o mensaje informativo

### Módulo de Alertas
1. **GET** `/api/v1/dashboard/alertas-rop` → Listar productos críticos
2. Mostrar botón "Ver Pedidos Sugeridos"

### Módulo de Pedidos Sugeridos
1. **GET** `/api/v1/pedidos-sugeridos/estado/PENDIENTE` → Mostrar tabla
2. Acciones por pedido:
   - Aprobar: **PATCH** `/pedidos-sugeridos/{id}/estado?estado=APROBADO`
   - Rechazar: **PATCH** `/pedidos-sugeridos/{id}/estado?estado=RECHAZADO`
3. Ver detalle: **GET** `/pedidos-sugeridos/{id}`

### Módulo de Consolidación
1. **GET** `/api/v1/dashboard/aglomeracion` → Mostrar agrupación por proveedor
2. Destacar ahorro estimado en badge/card
3. Botón "Aprobar Consolidación" → Cambiar estado de todos los pedidos a APROBADO

### Auditoría Física
1. Botón "Descargar Excel" → **GET** `/api/v1/inventario/export/excel`
2. Usuario descarga, imprime y verifica físicamente
3. Registra ajustes usando endpoint de movimientos (si aplica)

---

## 📋 Casos de Uso por Vista

| Vista | Endpoints Principales | Funcionalidad |
|-------|----------------------|---------------|
| **Dashboard Principal** | `/inventory-kpis`, `/alertas-rop` | Resumen general, KPIs, alertas |
| **Gestión de Pedidos** | `/pedidos-sugeridos`, `/pedidos-sugeridos/estado/{estado}` | Revisar, aprobar/rechazar pedidos |
| **Consolidación** | `/dashboard/aglomeracion` | Optimizar costos agrupando por proveedor |
| **Auditoría** | `/inventario/export/excel` | Descarga de reporte físico |

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT (si está habilitada en el backend).

**Headers Requeridos:**
```
Authorization: Bearer {token}
```

---

## ⚠️ Códigos de Error Comunes

| Código | Descripción | Solución |
|--------|-------------|----------|
| 200 | OK | Solicitud exitosa |
| 401 | Unauthorized | Verificar token JWT, puede estar vencido |
| 404 | Not Found | ID de recurso no existe |
| 500 | Internal Server Error | Error en servidor, revisar logs |

---

## 📞 Soporte Técnico

Para reportar problemas, incluir:
- **Endpoint consultado** (URL completa)
- **Método HTTP** (GET, POST, PATCH, etc.)
- **Request Headers** (sin exponer token completo)
- **Request Body** (si aplica)
- **Response recibida** (status code + body)
- **Logs del navegador** (Console → Network → Response)
