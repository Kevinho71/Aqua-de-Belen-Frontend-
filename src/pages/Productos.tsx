import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';
import { Pagination } from '../components/ui/Pagination';
import type { Producto, ProductoDTORequest, Sublote, Page } from '../types';


export const Productos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isSublotesModalOpen, setIsSublotesModalOpen] = useState(false);
  const [searchNombre, setSearchNombre] = useState('');
  const [searchTipoProductoId, setSearchTipoProductoId] = useState('');
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm<ProductoDTORequest>();

  const { data: productosData, isLoading } = useQuery({
    queryKey: ['productos', searchNombre, searchTipoProductoId, page],
    queryFn: async () => {
      const hasFilters = searchNombre || searchTipoProductoId;
      const endpoint = hasFilters ? '/productos/buscar' : '/productos';
      const params: Record<string, any> = {};
      
      if (hasFilters) {
        if (searchNombre) params.nombre = searchNombre;
        if (searchTipoProductoId) params.tipoProductoId = searchTipoProductoId;
      } else {
        params.page = page;
        params.size = 10;
      }

      const res = await api.get(endpoint, { params });
      const data = res.data;
      
      // Normalizar respuesta para manejar tanto Page<T> como T[]
      if (data && 'content' in data) {
        return data as Page<Producto>;
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
      } as Page<Producto>;
    }
  });

  const productos = productosData?.content || [];
  const totalPages = productosData?.totalPages || 0;

  const { data: tiposProducto } = useQuery({
    queryKey: ['tiposProducto'],
    queryFn: async () => {
      const res = await api.get('/productos/tipos');
      return res.data;
    }
  });

  const { data: sublotes } = useQuery({
    queryKey: ['sublotes-producto', selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return [];
      const res = await api.get<Sublote[]>(`/productos/${selectedProductId}/sublotes`);
      return res.data;
    },
    enabled: !!selectedProductId
  });

  const createMutation = useMutation({
    mutationFn: (newProduct: ProductoDTORequest) => api.post('/productos', newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setIsModalOpen(false);
      reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: ProductoDTORequest }) => api.put(`/productos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setIsModalOpen(false);
      setEditingProduct(null);
      reset();
    }
  });

  const toggleDiscontinueMutation = useMutation({
    mutationFn: async (producto: Producto) => {
      const id = producto.productoId || producto.id;
      if (!id) throw new Error("ID de producto no encontrado");
      
      // Obtenemos el producto completo para asegurar tener el tipoProductoId correcto
      const { data: fullProduct } = await api.get<Producto>(`/productos/${id}`);
      
      const data: ProductoDTORequest = {
        nombre: fullProduct.nombre,
        precio: parseFloat(fullProduct.precio),
        descripcion: fullProduct.descripcion,
        tipoProductoId: fullProduct.tipoProductoId,
        descontinuado: !fullProduct.descontinuado
      };
      return api.put(`/productos/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    }
  });

  const onSubmit = (data: ProductoDTORequest) => {
    if (editingProduct) {
      const id = editingProduct.productoId || editingProduct.id;
      if (id) {
        updateMutation.mutate({ id: id.toString(), data });
      }
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = async (product: Producto) => {
    const id = product.productoId || product.id;
    if (!id) return;

    try {
      // Cargamos los detalles completos para asegurar tener todos los campos (especialmente tipoProductoId)
      const { data: fullProduct } = await api.get<Producto>(`/productos/${id}`);
      setEditingProduct(fullProduct);
      setValue('nombre', fullProduct.nombre);
      setValue('precio', parseFloat(fullProduct.precio));
      setValue('descripcion', fullProduct.descripcion);
      setValue('tipoProductoId', fullProduct.tipoProductoId);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al cargar detalles del producto:", error);
      alert("No se pudieron cargar los detalles del producto. Intente nuevamente.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    reset();
  };

  const handleViewSublotes = (productoId: string) => {
    setSelectedProductId(productoId);
    setIsSublotesModalOpen(true);
  };

  const calcularStockTotal = (sublotesData: Sublote[]) => {
    return sublotesData?.reduce((total, sublote) => {
      return total + parseFloat(sublote.cantidadActual || '0');
    }, 0) || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={searchNombre}
              onChange={(e) => setSearchNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Producto</label>
            <select
              value={searchTipoProductoId}
              onChange={(e) => setSearchTipoProductoId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los tipos</option>
              {tiposProducto?.map((tipo: { id: number; nombre: string }) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchNombre('');
                setSearchTipoProductoId('');
              }}
              className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
              ) : productos?.map((producto, idx) => (
                <tr key={producto.productoId || producto.id || idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {producto.nombre}
                    {producto.descontinuado && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Descontinuado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {producto.tipoProducto}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{producto.precio} Bs</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewSublotes(producto.productoId || producto.id?.toString() || '')}
                      className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Package size={16} />
                      Ver Stock
                    </button>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">{producto.descripcion}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(producto)}
                      className="text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm(producto.descontinuado ? '¿Reactivar producto?' : '¿Descontinuar producto?')) {
                          toggleDiscontinueMutation.mutate(producto);
                        }
                      }}
                      className={`${producto.descontinuado ? 'text-green-500 hover:text-green-600' : 'text-red-400 hover:text-red-600'} transition-colors`}
                      title={producto.descontinuado ? "Reactivar" : "Descontinuar"}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  {...register('nombre', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('precio', { required: true, min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Producto ID</label>
                <input 
                  type="number"
                  min="0"
                  {...register('tipoProductoId', { required: true, min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea 
                  {...register('descripcion')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sublotes */}
      {isSublotesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-800">Sublotes del Producto</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Stock Total: <span className="font-bold text-primary-600">{calcularStockTotal(sublotes || [])} unidades</span>
                </p>
              </div>
              <button onClick={() => {
                setIsSublotesModalOpen(false);
                setSelectedProductId(null);
              }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {!sublotes || sublotes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay sublotes disponibles para este producto</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-left text-gray-600">
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Cantidad</th>
                      <th className="px-4 py-3">Vencimiento</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sublotes.map((sublote, idx) => (
                      <tr key={sublote.id || idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{sublote.codigoSublote}</td>
                        <td className="px-4 py-3">{sublote.cantidadActual}</td>
                        <td className="px-4 py-3">{sublote.fechaVencimiento}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            sublote.estado === 'Disponible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {sublote.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => {
                  setIsSublotesModalOpen(false);
                  setSelectedProductId(null);
                }}
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
