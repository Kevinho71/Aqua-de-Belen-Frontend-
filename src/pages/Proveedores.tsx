import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';
import type { Proveedor, ProveedorDTORequest, Ubicacion } from '../types';

export const Proveedores = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [searchNombre, setSearchNombre] = useState('');
  const [searchNit, setSearchNit] = useState('');
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProveedorDTORequest>();

  // Ubicaciones para el select
  const { data: ubicaciones } = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: async () => {
      const res = await api.get<Ubicacion[]>('/ubicaciones');
      return res.data;
    }
  });

  const { data: proveedores, isLoading } = useQuery({
    queryKey: ['proveedores', searchNombre, searchNit],
    queryFn: async () => {
      const hasFilters = searchNombre || searchNit;
      const endpoint = hasFilters ? '/proveedor/buscar' : '/proveedor';
      const params: Record<string, string> = {};
      if (searchNombre) params.nombre = searchNombre;
      if (searchNit) params.nit = searchNit;
      const res = await api.get<Proveedor[]>(endpoint, { params: hasFilters ? params : undefined });
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (newProveedor: ProveedorDTORequest) => api.post('/proveedor', newProveedor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error al crear proveedor:', error);
      alert('Error al crear proveedor');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: ProveedorDTORequest }) => api.put(`/proveedor/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error al actualizar proveedor:', error);
      alert('Error al actualizar proveedor');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/proveedor/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
    onError: (error) => {
      console.error('Error al eliminar proveedor:', error);
      alert('Error al eliminar proveedor');
    }
  });

  const onSubmit = (data: ProveedorDTORequest) => {
    const formattedData = {
      ...data,
      ubicacionId: Number(data.ubicacionId)
    };

    if (editingProveedor) {
      updateMutation.mutate({ id: editingProveedor.id.toString(), data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setValue('nombre', proveedor.nombre);
    setValue('nit', proveedor.nit);
    setValue('telefono', proveedor.telefono);
    setValue('correo', proveedor.correo);
    setValue('ubicacionId', proveedor.ubicacionId);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      deleteMutation.mutate(id.toString());
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProveedor(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Proveedores</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Proveedor
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={searchNombre}
              onChange={(e) => setSearchNombre(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
            <input
              type="text"
              value={searchNit}
              onChange={(e) => setSearchNit(e.target.value)}
              placeholder="Buscar por NIT..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchNombre('');
                setSearchNit('');
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
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">NIT</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Correo</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
              ) : proveedores?.map((proveedor) => (
                <tr key={proveedor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{proveedor.nombre}</td>
                  <td className="px-6 py-4">{proveedor.nit}</td>
                  <td className="px-6 py-4">{proveedor.telefono}</td>
                  <td className="px-6 py-4">{proveedor.correo}</td>
                  <td className="px-6 py-4">{proveedor.ubicacion}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(proveedor)}
                      className="text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(proveedor.id)}
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">
                {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  {...register('nombre', { required: 'Requerido' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.nombre && <span className="text-red-500 text-xs">{errors.nombre.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
                <input 
                  {...register('nit')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input 
                    {...register('telefono')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                  <input 
                    type="email"
                    {...register('correo')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <select
                  {...register('ubicacionId', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccione una ubicación</option>
                  {ubicaciones?.map((u) => (
                    <option key={u.id} value={u.id}>{u.ubicacion}</option>
                  ))}
                </select>
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
                  {editingProveedor ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
