import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, X, Trash2 } from 'lucide-react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { api } from '../services/api';
import { Pagination } from '../components/ui/Pagination';
import type { Venta, Cliente, Producto, MetodoPago, VentaRequest, Sublote, Page } from '../types';

export const Ventas = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [productoStocks, setProductoStocks] = useState<Record<string, number>>({});
  const [searchClienteId, setSearchClienteId] = useState('');
  const [searchFechaInicio, setSearchFechaInicio] = useState('');
  const [searchFechaFin, setSearchFechaFin] = useState('');
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { register, control, handleSubmit, reset, formState: { errors }, watch } = useForm<VentaRequest>({
    defaultValues: {
      // @ts-expect-error: Inicializamos con valores vacíos para validación
      clienteId: '',
      // @ts-expect-error: Inicializamos con valores vacíos para validación
      metodoDePagoId: '',
      conFactura: false,
      // @ts-expect-error: Inicializamos con valores vacíos para validación
      detalles: [{ productoId: '', cantidad: 1, descuento: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "detalles"
  });

  // Queries
  const { data: ventasData, isLoading } = useQuery({
    queryKey: ['ventas', searchClienteId, searchFechaInicio, searchFechaFin, page],
    queryFn: async () => {
      const hasFilters = searchClienteId || searchFechaInicio || searchFechaFin;
      const endpoint = hasFilters ? '/ventas/buscar' : '/ventas';
      const params: Record<string, any> = {};
      
      if (hasFilters) {
        if (searchClienteId) params.clienteId = searchClienteId;
        if (searchFechaInicio) params.fechaInicio = searchFechaInicio;
        if (searchFechaFin) params.fechaFin = searchFechaFin;
      } else {
        params.page = page;
        params.size = 10;
      }

      const res = await api.get(endpoint, { params });
      const data = res.data;

      if (data && 'content' in data) {
        return data as Page<Venta>;
      }

      // Si el backend devuelve un array plano, simulamos la paginación
      const isArray = Array.isArray(data);
      const currentCount = isArray ? data.length : 0;
      const pageSize = 10;
      // Si recibimos una página llena, asumimos que hay al menos una página más
      const calculatedTotalPages = currentCount === pageSize ? page + 2 : page + 1;

      return { 
        content: isArray ? data : [], 
        totalPages: calculatedTotalPages, 
        number: page, 
        totalElements: 0,
        size: pageSize,
        first: page === 0,
        last: currentCount < pageSize,
        empty: !data || currentCount === 0
      } as Page<Venta>;
    }
  });

  const ventas = ventasData?.content || [];
  const totalPages = ventasData?.totalPages || 0;

  const { data: clientes } = useQuery({
    queryKey: ['clientes-all'],
    queryFn: async () => {
      const res = await api.get('/clientes', { params: { page: 0, size: 1000 } });
      const data = res.data;
      return data && 'content' in data ? data.content : data;
    }
  });

  const { data: productos } = useQuery({
    queryKey: ['productos-all'],
    queryFn: async () => {
      const res = await api.get('/productos', { params: { page: 0, size: 1000 } });
      const data = res.data;
      return data && 'content' in data ? data.content : data;
    }
  });

  // Cargar todos los stocks al cargar los productos
  useEffect(() => {
    const loadAllProductStocks = async () => {
      if (!productos) return;
      
      const stocksPromises = productos.map(async (producto: any) => {
        const productoId = (producto.productoId || producto.id)?.toString() || '';
        if (!productoId) return null;
        
        try {
          const res = await api.get<Sublote[]>(`/productos/${productoId}/sublotes`);
          const stock = res.data.reduce((total, sublote) => {
            return total + parseFloat(sublote.cantidadActual || '0');
          }, 0);
          return { productoId, stock };
        } catch (error) {
          console.error(`Error al cargar stock del producto ${productoId}:`, error);
          return { productoId, stock: 0 };
        }
      });

      const stocksResults = await Promise.all(stocksPromises);
      const stocksMap: Record<string, number> = {};
      stocksResults.forEach(result => {
        if (result) {
          stocksMap[result.productoId] = result.stock;
        }
      });
      setProductoStocks(stocksMap);
    };

    loadAllProductStocks();
  }, [productos]);

  const { data: metodosPago } = useQuery({
    queryKey: ['metodosPago'],
    queryFn: async () => {
      const res = await api.get<MetodoPago[]>('/ventas/metodos-pago');
      return res.data;
    }
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: (newVenta: VentaRequest) => api.post('/ventas', newVenta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      setIsModalOpen(false);
      reset();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.error('Error al crear venta:', error);
      const serverMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      alert(`Error al crear la venta: ${serverMessage}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ventas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
    },
    onError: (error) => {
      console.error('Error al eliminar venta:', error);
      alert('Error al eliminar venta');
    }
  });

  const onSubmit: SubmitHandler<VentaRequest> = (data) => {
    try {
      const formattedData = {
        clienteId: Number(data.clienteId),
        metodoDePagoId: Number(data.metodoDePagoId),
        conFactura: Boolean(data.conFactura),
        detalles: data.detalles.map(d => ({
          productoId: Number(d.productoId),
          cantidad: Number(d.cantidad),
          descuento: Number(d.descuento || 0)
        }))
      };

      // Validaciones básicas
      if (formattedData.clienteId <= 0 || isNaN(formattedData.clienteId)) {
        alert("Seleccione un cliente válido");
        return;
      }
      if (formattedData.metodoDePagoId <= 0 || isNaN(formattedData.metodoDePagoId)) {
        alert("Seleccione un método de pago válido");
        return;
      }
      const productosInvalidos = formattedData.detalles.filter(d => d.productoId <= 0 || isNaN(d.productoId));
      if (productosInvalidos.length > 0) {
        alert("Hay productos seleccionados inválidos");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createMutation.mutate(formattedData as any);
    } catch (e) {
      console.error("Error formateando datos:", e);
      alert("Error preparando los datos para el envío");
    }
  };

  const handleView = async (venta: Venta) => {
    try {
      // Fetch full details if not present
      const res = await api.get<Venta>(`/ventas/${venta.ventaId}`);
      setSelectedVenta(res.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching venta details:", error);
      // Fallback to showing what we have
      setSelectedVenta(venta);
      setIsViewModalOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta venta?')) {
      deleteMutation.mutate(id);
    }
  };

  // Calcular total estimado (opcional, solo visual)
  const detalles = watch('detalles');
  const totalEstimado = detalles?.reduce((acc, curr) => {
    const prod = productos?.find((p: any) => (p.productoId || p.id) == curr.productoId);
    const precio = prod ? parseFloat(prod.precio.replace(' Bs', '').trim()) : 0;
    const cantidad = Number(curr.cantidad) || 0;
    const descuento = Number(curr.descuento) || 0;
    return acc + (precio * cantidad) - descuento;
  }, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nueva Venta
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select
              value={searchClienteId}
              onChange={(e) => setSearchClienteId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los clientes</option>
              {clientes?.map((cliente: any) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={searchFechaInicio}
              onChange={(e) => setSearchFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={searchFechaFin}
              onChange={(e) => setSearchFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchClienteId('');
                setSearchFechaInicio('');
                setSearchFechaFin('');
              }}
              className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Factura</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
              ) : ventas?.map((venta) => (
                <tr key={venta.ventaId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary-600">#{venta.ventaId}</td>
                  <td className="px-6 py-4">{venta.cliente}</td>
                  <td className="px-6 py-4">{venta.fecha}</td>
                  <td className="px-6 py-4 font-medium">{venta.totalNeto}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      venta.conFactura === 'Sí' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {venta.conFactura}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleView(venta)}
                      className="text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Modal Nueva Venta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-semibold text-gray-800">Registrar Nueva Venta</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <form onSubmit={handleSubmit(onSubmit as any)} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <select 
                    {...register('clienteId', { required: 'Seleccione un cliente' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccione un cliente...</option>
                    {clientes?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nombreCompleto || `${c.nombre} ${c.apellido}`}</option>
                    ))}
                  </select>
                  {errors.clienteId && <span className="text-red-500 text-xs">{errors.clienteId.message}</span>}
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                  <select 
                    {...register('metodoDePagoId', { required: 'Seleccione un método de pago' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccione...</option>
                    {metodosPago?.map(m => (
                      <option key={m.id} value={m.id}>{m.metodo}</option>
                    ))}
                  </select>
                  {errors.metodoDePagoId && <span className="text-red-500 text-xs">{errors.metodoDePagoId.message}</span>}
                </div>

                {/* Factura */}
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="conFactura"
                    {...register('conFactura')}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="conFactura" className="text-sm font-medium text-gray-700">Emitir Factura</label>
                </div>
              </div>

              {/* Detalles de Venta */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold text-gray-700">Productos</h4>
                  <button
                    type="button"
                    // @ts-expect-error: Inicializamos con string vacío para validación
                    onClick={() => append({ productoId: '', cantidad: 1, descuento: 0 })}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <Plus size={16} /> Agregar Producto
                  </button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Producto</label>
                          <select
                            {...register(`detalles.${index}.productoId`, { required: true })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Seleccionar...</option>
                              {productos?.map((p: any, idx: number) => {
                              const productoId = (p.productoId || p.id)?.toString() || '';
                              const stock = productoStocks[productoId];
                              return (
                                <option key={p.productoId || p.id || idx} value={productoId}>
                                  {p.nombre} - {p.precio} Bs {stock !== undefined ? `(Stock: ${stock})` : '(Cargando...)'}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                          <input
                            type="number"
                            step="1"
                            {...register(`detalles.${index}.cantidad`, { required: true, min: 1 })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Descuento (Bs)</label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`detalles.${index}.descuento`, { min: 0 })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end items-center gap-4">
                <div className="text-right">
                  <span className="text-sm text-gray-500">Total Estimado:</span>
                  <span className="ml-2 text-xl font-bold text-primary-600">{totalEstimado.toFixed(2)} Bs</span>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                disabled={createMutation.isPending}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={handleSubmit(onSubmit as any)}
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Procesando...' : 'Registrar Venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Venta */}
      {isViewModalOpen && selectedVenta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">Detalle de Venta #{selectedVenta.ventaId}</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedVenta.cliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium">{selectedVenta.fecha}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Neto</p>
                  <p className="font-medium text-primary-600">{selectedVenta.totalNeto}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Factura</p>
                  <p className="font-medium">{selectedVenta.conFactura}</p>
                </div>
              </div>

              {selectedVenta.detalles && selectedVenta.detalles.length > 0 ? (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Productos</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="pb-2">Producto</th>
                          <th className="pb-2">Cant.</th>
                          <th className="pb-2">P. Unit.</th>
                          <th className="pb-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVenta.detalles.map((d, idx) => (
                          <tr key={idx} className="border-t border-gray-200">
                            <td className="py-2">{d.producto}</td>
                            <td className="py-2">{d.cantidad}</td>
                            <td className="py-2">{d.costoUnitario || d.precioUnitario}</td>
                            <td className="py-2">{d.subtotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic mt-4">No hay detalles disponibles para esta venta.</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
