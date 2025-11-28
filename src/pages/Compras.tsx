import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, X, Trash2 } from 'lucide-react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { Pagination } from '../components/ui/Pagination';
import { api } from '../services/api';
import type { Compra, Proveedor, Producto, CompraDTORequest, Sublote, Page } from '../types';

export const Compras = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [productoStocks, setProductoStocks] = useState<Record<string, number>>({});
  const [searchProveedorId, setSearchProveedorId] = useState('');
  const [searchFechaInicio, setSearchFechaInicio] = useState('');
  const [searchFechaFin, setSearchFechaFin] = useState('');
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<CompraDTORequest>({
    defaultValues: {
      // @ts-expect-error: Inicializamos con string vacío para que funcione la validación 'required'
      detalles: [{ productoId: '', cantidad: 1, costoUnitario: 0, descuento: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "detalles"
  });

  const { data: comprasData, isLoading } = useQuery({
    queryKey: ['compras', searchProveedorId, searchFechaInicio, searchFechaFin, page],
    queryFn: async () => {
      const hasFilters = searchProveedorId || searchFechaInicio || searchFechaFin;
      const endpoint = hasFilters ? '/compras/buscar' : '/compras';
      const params: Record<string, string | number> = {};
      
      if (searchProveedorId) params.proveedorId = searchProveedorId;
      if (searchFechaInicio) params.fechaInicio = searchFechaInicio;
      if (searchFechaFin) params.fechaFin = searchFechaFin;

      if (!hasFilters) {
         params.page = page;
         params.size = 10;
      }

      const res = await api.get(endpoint, { params });
      const data = res.data;
      
      if (data && 'content' in data) {
        return data as Page<Compra>;
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
          totalElements: 0,
          last: currentCount < pageSize,
          size: pageSize,
          number: page,
          numberOfElements: currentCount,
          first: page === 0,
          empty: !data || currentCount === 0
      } as Page<Compra>;
    }
  });

  const compras = comprasData?.content;
  const totalPages = comprasData?.totalPages || 1;

  const { data: proveedores } = useQuery({
    queryKey: ['proveedores-all'],
    queryFn: async () => {
      const res = await api.get('/proveedor', { params: { page: 0, size: 1000 } });
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

  const createMutation = useMutation({
    mutationFn: (newCompra: CompraDTORequest) => api.post('/compras', newCompra),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      setIsModalOpen(false);
      reset();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.error('Error al crear compra:', error);
      const serverMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      alert(`Error al crear la compra: ${serverMessage}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/compras/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
    },
    onError: (error) => {
      console.error('Error al eliminar compra:', error);
      alert('Error al eliminar compra');
    }
  });

  const onSubmit: SubmitHandler<CompraDTORequest> = (data) => {
    console.log("Datos del formulario (raw):", data);

    try {
      const formattedData = {
        proveedorId: Number(data.proveedorId),
        detalles: data.detalles.map(d => {
          const detalle = {
            productoId: Number(d.productoId),
            costoUnitario: Number(d.costoUnitario),
            cantidad: Number(d.cantidad),
            descuento: Number(d.descuento || 0),
            // Enviar null si la fecha está vacía, el backend lo acepta
            vencimiento: d.vencimiento || null
          };
          return detalle;
        })
      };

      console.log("Datos a enviar (formatted):", formattedData);
      
      // Validaciones de seguridad antes de enviar
      if (formattedData.proveedorId <= 0 || isNaN(formattedData.proveedorId)) {
        alert("ID de proveedor inválido");
        return;
      }
      
      const productosInvalidos = formattedData.detalles.filter(d => d.productoId <= 0 || isNaN(d.productoId));
      if (productosInvalidos.length > 0) {
        alert("Hay productos seleccionados inválidos (ID 0 o vacío)");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createMutation.mutate(formattedData as any);
    } catch (e) {
      console.error("Error formateando datos:", e);
      alert("Error preparando los datos para el envío");
    }
  };

  const handleView = async (compra: Compra) => {
    try {
      // Fetch full details if not present
      const res = await api.get<Compra>(`/compras/${compra.id}`);
      setSelectedCompra(res.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching compra details:", error);
      // Fallback to showing what we have
      setSelectedCompra(compra);
      setIsViewModalOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta compra?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Compras</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nueva Compra
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <select
              value={searchProveedorId}
              onChange={(e) => setSearchProveedorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los proveedores</option>
              {proveedores?.map((proveedor: any) => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
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
                setSearchProveedorId('');
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
                <th className="px-6 py-4">Proveedor</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Costo Neto</th>
                <th className="px-6 py-4">Lote ID</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
              ) : compras?.map((compra) => (
                <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary-600">#{compra.id}</td>
                  <td className="px-6 py-4">{compra.proveedor}</td>
                  <td className="px-6 py-4">{compra.fecha}</td>
                  <td className="px-6 py-4 font-medium">{compra.costoNeto}</td>
                  <td className="px-6 py-4">{compra.loteId}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleView(compra)}
                      className="text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(compra.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
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

      {/* Modal Nueva Compra */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-semibold text-gray-800">Registrar Nueva Compra</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit as unknown as SubmitHandler<Record<string, unknown>>)} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Selección de Proveedor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                  <select 
                    {...register('proveedorId', { 
                      required: 'Seleccione un proveedor',
                      validate: (value) => Number(value) > 0 || 'Proveedor inválido'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccione un proveedor...</option>
                    {proveedores?.map((p: any, idx: number) => (
                      <option key={p.id || idx} value={p.id}>{p.nombre} - {p.nit}</option>
                    ))}
                  </select>
                  {errors.proveedorId && <span className="text-red-500 text-xs">{errors.proveedorId.message}</span>}
                </div>

                {/* Detalles de Compra */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-gray-700">Detalles de la Compra</h4>
                    <button
                      type="button"
                      // @ts-expect-error: Inicializamos con string vacío para validación
                      onClick={() => append({ productoId: '', cantidad: 1, costoUnitario: 0, descuento: 0 })}
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Producto</label>
                            <select
                              {...register(`detalles.${index}.productoId`, { 
                                required: 'Seleccione un producto',
                                // Validamos solo que tenga valor, la conversión numérica se hace al enviar
                                validate: (value) => !!value || 'Seleccione un producto'
                              })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="">Seleccionar...</option>
                              {productos?.map((p: any, idx: number) => {
                                const productoId = (p.productoId || p.id)?.toString() || '';
                                const stock = productoStocks[productoId];
                                return (
                                  <option key={p.productoId || p.id || idx} value={productoId}>
                                    {p.nombre} {stock !== undefined ? `(Stock actual: ${stock})` : '(Cargando...)'}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Costo Unit.</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register(`detalles.${index}.costoUnitario`, { required: true, min: 0 })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
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
                            <label className="block text-xs font-medium text-gray-500 mb-1">Descuento</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register(`detalles.${index}.descuento`, { min: 0 })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>

                          <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Vencimiento</label>
                            <input
                              type="date"
                              {...register(`detalles.${index}.vencimiento`)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit(onSubmit as unknown as SubmitHandler<Record<string, unknown>>)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                Registrar Compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Compra */}
      {isViewModalOpen && selectedCompra && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">Detalle de Compra #{selectedCompra.id}</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Proveedor</p>
                  <p className="font-medium">{selectedCompra.proveedor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium">{selectedCompra.fecha}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Costo Neto</p>
                  <p className="font-medium text-primary-600">{selectedCompra.costoNeto}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lote ID</p>
                  <p className="font-medium">{selectedCompra.loteId}</p>
                </div>
              </div>

              {selectedCompra.detalles && selectedCompra.detalles.length > 0 ? (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Productos</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="pb-2">Producto</th>
                          <th className="pb-2">Cant.</th>
                          <th className="pb-2">Costo Unit.</th>
                          <th className="pb-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCompra.detalles.map((d, idx) => (
                          <tr key={idx} className="border-t border-gray-200">
                            <td className="py-2">{d.producto}</td>
                            <td className="py-2">{d.cantidad}</td>
                            <td className="py-2">{d.costoUnitario}</td>
                            <td className="py-2">{d.subtotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic mt-4">No hay detalles disponibles para esta compra.</p>
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
