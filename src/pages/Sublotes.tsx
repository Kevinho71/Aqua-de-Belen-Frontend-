import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, X } from 'lucide-react';
import { api } from '../services/api';
import { Pagination } from '../components/ui/Pagination';
import type { Sublote, Producto, Page } from '../types';

export const Sublotes = () => {
  const [selectedSublote, setSelectedSublote] = useState<Sublote | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchProductoId, setSearchProductoId] = useState('');
  const [searchEstado, setSearchEstado] = useState('');
  const [page, setPage] = useState(0);

  const { data: sublotesData, isLoading } = useQuery({
    queryKey: ['sublotes', searchProductoId, searchEstado, page],
    queryFn: async () => {
      const hasFilters = searchProductoId || searchEstado;
      const endpoint = hasFilters ? '/sublotes/buscar' : '/sublotes';
      const params: Record<string, string | number> = {};
      if (searchProductoId) params.productoId = searchProductoId;
      if (searchEstado) params.estado = searchEstado;
      
      if (!hasFilters) {
        params.page = page;
        params.size = 10;
      }

      const res = await api.get(endpoint, { params });
      const data = res.data;

      if (data && 'content' in data) {
        return data as Page<Sublote>;
      }

      const isArray = Array.isArray(data);
      const currentCount = isArray ? data.length : 0;
      const pageSize = 10;
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
      } as Page<Sublote>;
    }
  });

  const sublotes = sublotesData?.content || [];
  const totalPages = sublotesData?.totalPages || 1;

  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const res = await api.get<Producto[]>('/productos');
      return res.data;
    }
  });

  const handleView = (sublote: Sublote) => {
    setSelectedSublote(sublote);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Sublotes</h1>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <select
              value={searchProductoId}
              onChange={(e) => setSearchProductoId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los productos</option>
              {productos?.map((producto: Producto) => (
                <option key={producto.productoId || producto.id} value={producto.productoId || producto.id}>
                  {producto.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={searchEstado}
              onChange={(e) => setSearchEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los estados</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="AGOTADO">Agotado</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchProductoId('');
                setSearchEstado('');
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
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Cantidad Actual</th>
                <th className="px-6 py-4">Vencimiento</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
              ) : sublotes?.map((sublote) => (
                <tr key={sublote.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{sublote.codigoSublote}</td>
                  <td className="px-6 py-4">{sublote.producto}</td>
                  <td className="px-6 py-4">{sublote.cantidadActual}</td>
                  <td className="px-6 py-4">{sublote.fechaVencimiento}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sublote.estado?.toUpperCase() === 'DISPONIBLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {sublote.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleView(sublote)}
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

      {/* Modal Ver Sublote */}
      {isViewModalOpen && selectedSublote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">Detalle de Sublote</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Código</p>
                <p className="font-medium">{selectedSublote.codigoSublote}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Producto</p>
                <p className="font-medium">{selectedSublote.producto}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cantidad Inicial</p>
                  <p className="font-medium">{selectedSublote.cantidadInicial}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cantidad Actual</p>
                  <p className="font-medium">{selectedSublote.cantidadActual}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Fecha Producción</p>
                  <p className="font-medium">{selectedSublote.fechaProduccion}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha Vencimiento</p>
                  <p className="font-medium">{selectedSublote.fechaVencimiento}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Costo Unitario</p>
                <p className="font-medium">{selectedSublote.costoUnitario}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedSublote.estado?.toUpperCase() === 'DISPONIBLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedSublote.estado}
                </span>
              </div>
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
