import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { api } from '../services/api';
import { Pagination } from '../components/ui/Pagination';
import type { Movimiento, Page } from '../types';

export const Movimientos = () => {
  const [searchTipo, setSearchTipo] = useState('');
  const [searchFechaInicio, setSearchFechaInicio] = useState('');
  const [searchFechaFin, setSearchFechaFin] = useState('');
  const [searchSubloteId, setSearchSubloteId] = useState('');
  const [page, setPage] = useState(0);

  const { data: movimientosData, isLoading } = useQuery({
    queryKey: ['movimientos', searchTipo, searchFechaInicio, searchFechaFin, searchSubloteId, page],
    queryFn: async () => {
      const hasFilters = searchTipo || searchFechaInicio || searchFechaFin || searchSubloteId;
      const endpoint = hasFilters ? '/movimientos/buscar' : '/movimientos';
      const params: Record<string, string | number> = {};
      if (searchTipo) params.tipo = searchTipo;
      if (searchFechaInicio) params.fechaInicio = searchFechaInicio;
      if (searchFechaFin) params.fechaFin = searchFechaFin;
      if (searchSubloteId) params.subloteId = searchSubloteId;
      
      if (!hasFilters) {
        params.page = page;
        params.size = 10;
      }

      const res = await api.get(endpoint, { params });
      const data = res.data;

      if (data && 'content' in data) {
        return data as Page<Movimiento>;
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
      } as Page<Movimiento>;
    }
  });

  const movimientos = movimientosData?.content || [];
  const totalPages = movimientosData?.totalPages || 1;

  const { data: sublotes } = useQuery({
    queryKey: ['sublotes'],
    queryFn: async () => {
      const res = await api.get('/sublotes');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Movimientos de Inventario</h1>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={searchTipo}
              onChange={(e) => setSearchTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los tipos</option>
              <option value="COMPRA">Compra</option>
              <option value="VENTA">Venta</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sublote</label>
            <select
              value={searchSubloteId}
              onChange={(e) => setSearchSubloteId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los sublotes</option>
              {sublotes?.map((sublote: { id: number; codigoSublote: string }) => (
                <option key={sublote.id} value={sublote.id}>
                  {sublote.codigoSublote}
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
                setSearchTipo('');
                setSearchSubloteId('');
                setSearchFechaInicio('');
                setSearchFechaFin('');
              }}
              className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Cantidad</th>
                <th className="px-6 py-4">Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr>
              ) : movimientos?.map((movimiento, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">{movimiento.fecha}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      movimiento.tipo === 'ENTRADA' || movimiento.tipo === 'COMPRA' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {movimiento.tipo === 'ENTRADA' || movimiento.tipo === 'COMPRA' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      {movimiento.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{movimiento.cantidad}</td>
                  <td className="px-6 py-4 text-gray-500">{movimiento.referencia}</td>
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
    </div>
  );
};
