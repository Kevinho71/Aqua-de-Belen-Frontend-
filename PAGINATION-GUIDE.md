# 📄 Guía de Paginación - Lotes, Sublotes y Movimientos

## 📋 Endpoints con Paginación

Se ha agregado paginación a los siguientes endpoints con un **máximo de 10 elementos por página** por defecto:

### **1. Lotes**
```
GET /api/v1/lotes?page=0&size=10
```

### **2. Sublotes**
```
GET /api/v1/sublotes?page=0&size=10
```

### **3. Movimientos**
```
GET /api/v1/movimientos?page=0&size=10
```

---

## 🔧 Parámetros de Paginación

| Parámetro | Tipo | Valor por Defecto | Descripción |
|-----------|------|-------------------|-------------|
| `page` | int | `0` | Número de página (inicia en 0) |
| `size` | int | `10` | Cantidad de elementos por página |

---

## 📖 Ejemplos de Uso

### **Ejemplo 1: Obtener primera página (10 elementos)**
```bash
GET /api/v1/lotes
GET /api/v1/lotes?page=0&size=10
```

### **Ejemplo 2: Obtener segunda página**
```bash
GET /api/v1/lotes?page=1&size=10
```

### **Ejemplo 3: Obtener 20 elementos por página**
```bash
GET /api/v1/sublotes?page=0&size=20
```

### **Ejemplo 4: Obtener solo 5 elementos**
```bash
GET /api/v1/movimientos?page=0&size=5
```

---

## 🎯 Orden de los Resultados

Los datos se devuelven ordenados de **más recientes a más antiguos**:

- **Lotes:** Ordenados por `fechaIngreso DESC`
- **Sublotes:** Ordenados por `fechaVencimiento DESC`
- **Movimientos:** Ordenados por `fecha DESC`

---

## 💻 Uso desde Frontend

### **JavaScript/TypeScript:**

```typescript
// Obtener primera página de lotes
const getLotes = async (page = 0, size = 10) => {
  const response = await fetch(
    `http://localhost:8080/api/v1/lotes?page=${page}&size=${size}`
  );
  return await response.json();
};

// Uso
const primerosLotes = await getLotes(0, 10); // Página 1
const segundosLotes = await getLotes(1, 10); // Página 2
```

### **React con paginación:**

```typescript
import { useState } from 'react';

function LotesTable() {
  const [page, setPage] = useState(0);
  const [lotes, setLotes] = useState([]);
  const size = 10;

  const loadLotes = async (pageNum: number) => {
    const data = await fetch(
      `http://localhost:8080/api/v1/lotes?page=${pageNum}&size=${size}`
    ).then(res => res.json());
    
    setLotes(data);
    setPage(pageNum);
  };

  return (
    <div>
      <table>
        {/* Renderizar lotes */}
      </table>
      
      <div className="pagination">
        <button 
          onClick={() => loadLotes(page - 1)} 
          disabled={page === 0}
        >
          Anterior
        </button>
        <span>Página {page + 1}</span>
        <button onClick={() => loadLotes(page + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
```

---

## 📊 Archivos Modificados

### **Controladores:**
- ✅ `LoteController.java` - Agregado `page` y `size` al endpoint `/lotes`
- ✅ `SubloteController.java` - Agregado `page` y `size` al endpoint `/sublotes`
- ✅ `MovimientoController.java` - Agregado `page` y `size` al endpoint `/movimientos`

### **Interfaces DAO:**
- ✅ `LoteDAO.java` - Agregado método `list(int page, int size)`
- ✅ `SubloteDAO.java` - Agregado método `list(int page, int size)`
- ✅ `MovimientoDAO.java` - Agregado método `findAll(int page, int size)`

### **Implementaciones DAO:**
- ✅ `LoteDAOImpl.java` - Implementado método paginado con `setFirstResult()` y `setMaxResults()`
- ✅ `SubloteDAOImpl.java` - Implementado método paginado
- ✅ `MovimientoDAOImpl.java` - Implementado método paginado

### **Servicios:**
- ✅ `LoteServiceQuery.java` - Agregado método `listar(int page, int size)`
- ✅ `SubloteServiceQuery.java` - Agregado método `listar(int page, int size)`
- ✅ `MovimientoServiceQuery.java` - Agregado método `listar(int page, int size)`

---

## ✅ Ventajas de la Paginación

1. **Rendimiento mejorado:** Solo se cargan 10 registros a la vez en lugar de todos
2. **Menor uso de memoria:** Tanto en backend como frontend
3. **Experiencia de usuario mejorada:** Carga más rápida de datos
4. **Flexibilidad:** Puedes ajustar el tamaño de página según necesites

---

## 🔄 Retrocompatibilidad

Los endpoints **sin especificar parámetros** funcionan igual:
- `/api/v1/lotes` → Devuelve primeros 10 elementos (página 0)
- `/api/v1/sublotes` → Devuelve primeros 10 elementos (página 0)
- `/api/v1/movimientos` → Devuelve primeros 10 elementos (página 0)

---

## 📝 Notas Importantes

- La **numeración de páginas inicia en 0** (no en 1)
- El tamaño máximo recomendado es **50 elementos por página**
- Si `page` es mayor al número de páginas disponibles, se devuelve una lista vacía
- Los demás endpoints (`/buscar`, `/disponibles`, etc.) **NO** tienen paginación aún
