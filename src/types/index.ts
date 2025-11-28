export interface Producto {
  id?: string | number;
  productoId: string;
  nombre: string;
  precio: string;
  descripcion: string;
  tipoProducto: string;
  tipoProductoId: number;
  descontinuado?: boolean;
}

export interface ProductoDTORequest {
  nombre: string;
  precio: number;
  descripcion: string;
  tipoProductoId: number;
  descontinuado?: boolean;
}

export interface Ubicacion {
  id: number;
  ciudad: string;
  zona: string;
  ubicacion: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  telefono: string;
  nitCi: string;
  direccion: string;
  nivelFidelidad: string;
  nivelFidelidadId: number;
  ubicacion: string;
  ubicacionId: number;
}

export interface ClienteDTORequest {
  nombre: string;
  apellido: string;
  telefono?: string;
  nitCi?: string;
  direccion?: string;
  nivelFidelidadId: number;
  ubicacionId: number;
}

export interface Venta {
  ventaId: string;
  cliente: string;
  totalBruto: string;
  descuentoTotal: string;
  totalNeto: string;
  conFactura: string;
  fecha: string;
  detalles?: DetalleVenta[];
}

export interface DetalleVenta {
  idDetalle: string;
  producto: string;
  precioUnitario: string;
  costoUnitario?: string;
  cantidad: string;
  descuento: string;
  subtotal: string;
}

export interface VentaRequest {
  clienteId: number;
  metodoDePagoId: number;
  conFactura: boolean;
  detalles: {
    productoId: number;
    cantidad: number;
    descuento: number;
  }[];
}

export interface Compra {
  id: string;
  proveedor: string;
  costoBruto: string;
  costoNeto: string;
  descuentoTotal: string;
  loteId: number;
  fecha: string;
  detalles?: DetalleCompra[];
}

export interface DetalleCompra {
  compraId: string;
  producto: string;
  tipoProducto: string;
  cantidad: string;
  costoUnitario: string;
  descuento: string;
  subtotal: string;
}

export interface CompraDTORequest {
  proveedorId: number;
  detalles: {
    productoId: number;
    costoUnitario: number;
    cantidad: number;
    descuento: number;
    vencimiento?: string;
  }[];
}

export interface Proveedor {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  nit: string;
  ubicacionId: number;
  ciudad: string;
  zona: string;
  ubicacion: string;
}

export interface ProveedorDTORequest {
  nombre: string;
  correo: string;
  telefono: string;
  nit: string;
  ubicacionId: number;
}

export interface Sublote {
  id: string;
  codigoSublote: string;
  producto: string;
  fechaVencimiento: string;
  fechaProduccion: string;
  cantidadInicial: string;
  cantidadActual: string;
  costoUnitario: string;
  estado: string;
  loteId: string;
}

export interface Lote {
  id: number;
  fechaIngreso: string;
  compraId: string;
  cantidadSublotes: string;
}

export interface MetodoPago {
  id: number;
  metodo: string;
}

export interface Movimiento {
  fecha: string;
  tipo: string;
  cantidad: string;
  referencia: string;
}

export interface MovimientoDetalle {
  id: string;
  cantidad: string;
  costoUnitario: string;
  precioUnitario: string;
  costoTotal: string;
  precioTotal: string;
  fecha: string;
  tipo: string;
  referencia: string;
}

export interface InventoryKPI {
  productoId: number;
  nombreProducto: string;
  clasificacionABC: string;
  eoq: number;
  puntoReorden: number;
  stockActual: number;
  estadoReposicion: string;
}

export interface PedidoSugerido {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidadSugerida: number;
  fechaSugerida: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'EJECUTADO';
  observacion: string;
  stockActualMomento: number;
  ropMomento: number;
}

export interface ProductoAglomerado {
  productoId: number;
  productoNombre: string;
  cantidadSugerida: number;
  stockActual: number;
  rop: number;
}

export interface AhorroDetalle {
  costoSeparado: number;
  costoConsolidado: number;
  ahorro: number;
  porcentajeAhorro: number;
}

export interface ConsolidacionProveedor {
  proveedorId: number;
  proveedorNombre: string;
  cantidadPedidos: number;
  productos: ProductoAglomerado[];
  ahorro: AhorroDetalle;
}

export interface AglomeracionResponse {
  consolidados: ConsolidacionProveedor[];
  ahorroTotalEstimado: number;
  totalProveedores: number;
  totalPedidosPendientes: number;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
