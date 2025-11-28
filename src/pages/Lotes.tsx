import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, X } from 'lucide-react';
import { api } from '../services/api';
import { Pagination } from '../components/ui/Pagination';
import type { Lote, Page } from '../types';

export const Lotes = () => {
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchCompraId, setSearchCompraId] = useState('');
  const [searchFechaInicio, setSearchFechaInicio] = useState('');
  const [searchFechaFin, setSearchFechaFin] = useState('');
  const [page, setPage] = useState(0);

  const { data: lotesData, isLoading } = useQuery({
    queryKey: ['lotes', searchCompraId, searchFechaInicio, searchFechaFin, page],
    queryFn: async () => {
      const hasFilters = searchCompraId || searchFechaInicio || searchFechaFin;
      const endpoint = hasFilters ? '/lotes/buscar' : '/lotes';
      const params: Record<string, string | number> = {};
      if (searchCompraId) params.compraId = searchCompraId;
      if (searchFechaInicio) params.fechaInicio = searchFechaInicio;
      if (searchFechaFin) params.fechaFin = searchFechaFin;
      
      if (!hasFilters) {
        params.page = page;
        params.size = 10;
      }

      const res = await api.get(endpoint, { params });
      const data = res.data;

      if (data && 'content' in data) {
        return data as Page<Lote>;
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
      } as Page<Lote>;
    }
  });

  const lotes = lotesData?.content || [];
  const totalPages = lotesData?.totalPages || 1;

  const { data: compras } = useQuery({
    queryKey: ['compras'],
    queryFn: async () => {
      const res = await api.get('/compras');
      return res.data;
    }
  });

  const handleView = (lote: Lote) => {
    setSelectedLote(lote);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Lotes</h1>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compra</label>
            <select
              value={searchCompraId}
              onChange={(e) => setSearchCompraId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas las compras</option>
              {compras?.map((compra: { id: number }) => (
                <option key={compra.id} value={compra.id}>
                  Compra #{compra.id}
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
                setSearchCompraId('');
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
                <th className="px-6 py-4">Fecha Ingreso</th>
                <th className="px-6 py-4">ID Compra</th>
                <th className="px-6 py-4">Cantidad Sublotes</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr>
              ) : lotes?.map((lote) => (
                <tr key={lote.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary-600">#{lote.id}</td>
                  <td className="px-6 py-4">{lote.fechaIngreso}</td>
                  <td className="px-6 py-4">{lote.compraId}</td>
                  <td className="px-6 py-4">{lote.cantidadSublotes}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleView(lote)}
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

      {/* Modal Ver Lote */}
      {isViewModalOpen && selectedLote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">Detalle de Lote #{selectedLote.id}</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Fecha de Ingreso</p>
                <p className="font-medium">{selectedLote.fechaIngreso}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID Compra Asociada</p>
                <p className="font-medium">#{selectedLote.compraId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cantidad de Sublotes</p>
                <p className="font-medium">{selectedLote.cantidadSublotes}</p>
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
