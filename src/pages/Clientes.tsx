import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';
import { Pagination } from '../components/ui/Pagination';
import type { Cliente, ClienteDTORequest, Ubicacion, NivelFidelidad, Page } from '../types';

export const Clientes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchNombre, setSearchNombre] = useState('');
  const [searchApellido, setSearchApellido] = useState('');
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ClienteDTORequest>();

  // Ubicaciones para el select
  const { data: ubicaciones } = useQuery<Ubicacion[]>({
    queryKey: ['ubicaciones'],
    queryFn: async () => {
      const res = await api.get('/ubicaciones');
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Obtener todos los clientes para extraer niveles de fidelidad únicos
  const { data: todosClientes } = useQuery<Cliente[]>({
    queryKey: ['clientes-all'],
    queryFn: async () => {
      const res = await api.get('/clientes', { params: { page: 0, size: 1000 } });
      const data = res.data;
      if (data && 'content' in data) {
        return data.content;
      }
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Extraer niveles de fidelidad únicos de los clientes existentes
  const nivelesFidelidad: NivelFidelidad[] = todosClientes
    ? Array.from(
        new Map(
          todosClientes
            .filter(c => c.nivelFidelidadId && c.nivelFidelidad)
            .map(c => [c.nivelFidelidadId, { id: c.nivelFidelidadId, nombre: c.nivelFidelidad }])
        ).values()
      ).sort((a, b) => a.id - b.id)
    : [];

  const { data: clientesData, isLoading } = useQuery({
    queryKey: ['clientes', searchNombre, searchApellido, page],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (searchNombre) params.nombre = searchNombre;
      if (searchApellido) params.apellido = searchApellido;
      
      const endpoint = Object.keys(params).length > 0 ? '/clientes/buscar' : '/clientes';
      
      if (Object.keys(params).length === 0) {
         params.page = page;
         params.size = 10;
      }

      const res = await api.get(endpoint, { params });
      const data = res.data;

      if (data && 'content' in data) {
         return data as Page<Cliente>;
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
      } as Page<Cliente>;
    }
  });

  const clientes = clientesData?.content || [];
  const totalPages = clientesData?.totalPages || 0;

  const createMutation = useMutation({
    mutationFn: (newCliente: ClienteDTORequest) => api.post('/clientes', newCliente),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error al crear cliente:', error);
      alert('Error al crear cliente');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: ClienteDTORequest }) => api.put(`/clientes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error al actualizar cliente:', error);
      alert('Error al actualizar cliente');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clientes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: (error) => {
      console.error('Error al eliminar cliente:', error);
      alert('Error al eliminar cliente');
    }
  });

  const onSubmit = (data: ClienteDTORequest) => {
    const formattedData = {
      ...data,
      nivelFidelidadId: Number(data.nivelFidelidadId),
      ubicacionId: Number(data.ubicacionId)
    };

    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setValue('nombre', cliente.nombre);
    setValue('apellido', cliente.apellido);
    setValue('telefono', cliente.telefono);
    setValue('nitCi', cliente.nitCi);
    setValue('direccion', cliente.direccion);
    setValue('nivelFidelidadId', cliente.nivelFidelidadId);
    setValue('ubicacionId', cliente.ubicacionId);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={searchNombre}
              onChange={(e) => setSearchNombre(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por apellido..." 
              value={searchApellido}
              onChange={(e) => setSearchApellido(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              setSearchNombre('');
              setSearchApellido('');
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">Nombre Completo</th>
                <th className="px-6 py-4">NIT/CI</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Fidelidad</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
              ) : clientes?.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{cliente.nombreCompleto}</td>
                  <td className="px-6 py-4">{cliente.nitCi}</td>
                  <td className="px-6 py-4">{cliente.telefono}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {cliente.nivelFidelidad}
                    </span>
                  </td>
                  <td className="px-6 py-4">{cliente.ubicacion}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(cliente)}
                      className="text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(cliente.id)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">
                {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input 
                    {...register('nombre', { required: 'Requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input 
                    {...register('apellido', { required: 'Requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.apellido && <span className="text-red-500 text-xs">{errors.apellido.message}</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIT / CI</label>
                <input 
                  {...register('nitCi')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input 
                  {...register('telefono')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input 
                  {...register('direccion')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Fidelidad</label>
                  <select
                    {...register('nivelFidelidadId', { required: true, valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccione un nivel</option>
                    {nivelesFidelidad?.map((nivel) => (
                      <option key={nivel.id} value={nivel.id}>{nivel.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                  <select
                    {...register('ubicacionId', { required: true, valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccione una ubicación</option>
                    {ubicaciones?.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombreCompleto}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending ? (editingCliente ? 'Actualizando...' : 'Guardando...') : (editingCliente ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
