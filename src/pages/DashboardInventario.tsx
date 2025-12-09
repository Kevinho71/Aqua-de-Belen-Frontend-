import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { AlertTriangle, CheckCircle, TrendingUp, Package, FileSpreadsheet, DollarSign, Truck } from 'lucide-react';
import type { InventoryKPI, AglomeracionResponse, PedidoSugerido } from '../types';

const LoadingSpinner = () => {
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const loadingMessages = [
    '🔍 Calculando ROP...',
    '📊 Calculando EOQ...',
    '📦 Analizando inventario...',
    '⚡ Clasificando ABC...',
    '🎯 Creando órdenes...',
    '🔄 Consolidando pedidos...',
    '✨ Puliendo detalles...',
    '🚀 Casi listo...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-gradient-to-br from-white to-purple-50/50 p-8 rounded-2xl shadow-lg border border-purple-100 max-w-sm w-full">
        {/* Animated Spinner */}
        <div className="relative mb-6">
          <div className="w-16 h-16 mx-auto">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-spin" 
                 style={{ borderTopColor: '#a855f7', animationDuration: '1s' }} />
            
            {/* Middle ring */}
            <div className="absolute inset-1 border-4 border-pink-200 rounded-full animate-spin" 
                 style={{ borderTopColor: '#ec4899', animationDuration: '1.5s', animationDirection: 'reverse' }} />
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Analizando Inventario
          </h3>
          <p className="text-gray-600 text-sm font-medium min-h-[20px] transition-all duration-300">
            {loadingMessages[currentMessage]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500 rounded-full animate-pulse"
               style={{ width: `${((currentMessage + 1) / loadingMessages.length) * 100}%`, transition: 'width 1.5s ease-in-out' }} />
        </div>

        {/* Loading dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export const DashboardInventario = () => {
  const [activeTab, setActiveTab] = useState<'kpis' | 'alertas' | 'pedidos' | 'consolidacion'>('kpis');
  const queryClient = useQueryClient();

  const { data: kpis, isLoading, error } = useQuery({
    queryKey: ['inventory-kpis'],
    queryFn: async () => {
      const res = await api.get<InventoryKPI[]>('/dashboard/inventory-kpis');
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: 'always'
  });

  const { data: alertas } = useQuery({
    queryKey: ['alertas-rop'],
    queryFn: async () => {
      const res = await api.get<InventoryKPI[]>('/dashboard/alertas-rop');
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: 'always'
  });

  const { data: pedidosSugeridos } = useQuery({
    queryKey: ['pedidos-sugeridos', 'PENDIENTE'],
    queryFn: async () => {
      const res = await api.get<PedidoSugerido[]>('/pedidos-sugeridos/estado/PENDIENTE');
      return res.data;
    },
    staleTime: 0
  });

  const { data: aglomeracion } = useQuery({
    queryKey: ['aglomeracion'],
    queryFn: async () => {
      const res = await api.get<AglomeracionResponse>('/dashboard/aglomeracion');
      return res.data;
    },
    staleTime: 0
  });

  const cambiarEstadoPedidoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number, estado: string }) => 
      api.patch(`/pedidos-sugeridos/${id}/estado`, null, { params: { estado } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-sugeridos'] });
      queryClient.invalidateQueries({ queryKey: ['aglomeracion'] });
    }
  });

  const handleDownloadExcel = async () => {
    try {
      const response = await api.get('/inventario/export/excel', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.setAttribute('download', `Inventario_Continuo_${timestamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al descargar Excel:', error);
      alert('Error al descargar el archivo Excel');
    }
  };

  const handleAprobarPedido = (id: number) => {
    if (confirm('¿Aprobar este pedido sugerido?')) {
      cambiarEstadoPedidoMutation.mutate({ id, estado: 'APROBADO' });
    }
  };

  const handleRechazarPedido = (id: number) => {
    if (confirm('¿Rechazar este pedido sugerido?')) {
      cambiarEstadoPedidoMutation.mutate({ id, estado: 'RECHAZADO' });
    }
  };

  const handleAprobarConsolidacion = (proveedorId: number) => {
    const pedidos = pedidosSugeridos?.filter(p => 
      aglomeracion?.consolidados.find(c => c.proveedorId === proveedorId)?.productos
        .some(prod => prod.productoId === p.productoId)
    );
    
    if (confirm(`¿Aprobar todos los ${pedidos?.length || 0} pedidos de este proveedor?`)) {
      pedidos?.forEach(pedido => {
        cambiarEstadoPedidoMutation.mutate({ id: pedido.id, estado: 'APROBADO' });
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Análisis de Inventario</h1>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
          >
            <FileSpreadsheet size={20} />
            Descargar Excel
          </button>
        </div>
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Análisis de Inventario</h1>
      <div className="flex items-center justify-center py-20">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={28} />
            <div>
              <h3 className="text-red-800 font-bold text-lg">Error al cargar datos</h3>
              <p className="text-red-700 text-sm mt-1">No se pudo cargar el análisis de inventario. Por favor, intenta de nuevo.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Análisis de Inventario</h1>
        <button
          onClick={handleDownloadExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <FileSpreadsheet size={20} />
          Descargar Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex gap-4 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('kpis')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'kpis'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              KPIs & Clasificación ABC
            </button>
            <button
              onClick={() => setActiveTab('alertas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'alertas'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alertas ROP ({alertas?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pedidos'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pedidos Sugeridos ({pedidosSugeridos?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('consolidacion')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'consolidacion'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Consolidación ({aglomeracion?.totalProveedores || 0} proveedores)
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'kpis' && (
            <>
              {/* Resumen Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500 rounded-lg text-white">
                      <Package size={20} />
                    </div>
                    <h3 className="font-medium text-blue-900">Total Productos</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{kpis?.length || 0}</p>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-500 rounded-lg text-white">
                      <AlertTriangle size={20} />
                    </div>
                    <h3 className="font-medium text-red-900">Reordenar</h3>
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {kpis?.filter(k => k.estadoReposicion === 'REORDENAR').length || 0}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500 rounded-lg text-white">
                      <CheckCircle size={20} />
                    </div>
                    <h3 className="font-medium text-green-900">Stock OK</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {kpis?.filter(k => k.estadoReposicion === 'OK').length || 0}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500 rounded-lg text-white">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="font-medium text-purple-900">Clase A (80%)</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {kpis?.filter(k => k.clasificacionABC === 'A').length || 0}
                  </p>
                </div>
              </div>

              {/* Tabla KPIs */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900 font-medium">
                    <tr>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4 text-center">ABC</th>
                      <th className="px-6 py-4 text-center">Stock</th>
                      <th className="px-6 py-4 text-center">ROP</th>
                      <th className="px-6 py-4 text-center">EOQ</th>
                      <th className="px-6 py-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {kpis?.map((item) => (
                      <tr key={item.productoId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.nombreProducto}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                            ${item.clasificacionABC === 'A' ? 'bg-green-100 text-green-800' : 
                              item.clasificacionABC === 'B' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {item.clasificacionABC}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium">{item.stockActual}</td>
                        <td className="px-6 py-4 text-center">{item.puntoReorden}</td>
                        <td className="px-6 py-4 text-center">{item.eoq}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
                            ${item.estadoReposicion === 'REORDENAR' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {item.estadoReposicion === 'REORDENAR' ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                            {item.estadoReposicion}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'alertas' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <AlertTriangle size={20} />
                  <h3 className="font-semibold">Productos que Requieren Reorden Inmediato</h3>
                </div>
                <p className="text-sm text-red-700">
                  Los siguientes productos han alcanzado o están por debajo de su punto de reorden (ROP). Se recomienda generar pedidos.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900 font-medium">
                    <tr>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4 text-center">ABC</th>
                      <th className="px-6 py-4 text-center">Stock Actual</th>
                      <th className="px-6 py-4 text-center">ROP</th>
                      <th className="px-6 py-4 text-center">EOQ Sugerido</th>
                      <th className="px-6 py-4 text-center">Déficit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alertas?.map((item) => (
                      <tr key={item.productoId} className="hover:bg-red-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.nombreProducto}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                            ${item.clasificacionABC === 'A' ? 'bg-green-100 text-green-800' : 
                              item.clasificacionABC === 'B' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {item.clasificacionABC}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-red-600">{item.stockActual}</td>
                        <td className="px-6 py-4 text-center">{item.puntoReorden}</td>
                        <td className="px-6 py-4 text-center font-medium text-blue-600">{item.eoq}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            -{item.puntoReorden - item.stockActual}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'pedidos' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Package size={20} />
                  <h3 className="font-semibold">Pedidos Sugeridos Pendientes</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Estos pedidos fueron generados automáticamente por el sistema. Revise y apruebe/rechace según corresponda.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900 font-medium">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4 text-center">Cantidad Sugerida</th>
                      <th className="px-6 py-4 text-center">Stock Actual</th>
                      <th className="px-6 py-4 text-center">ROP</th>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pedidosSugeridos?.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-primary-600">#{pedido.id}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{pedido.productoNombre}</td>
                        <td className="px-6 py-4 text-center font-bold text-blue-600">{pedido.cantidadSugerida}</td>
                        <td className="px-6 py-4 text-center">{pedido.stockActualMomento}</td>
                        <td className="px-6 py-4 text-center">{pedido.ropMomento}</td>
                        <td className="px-6 py-4">{pedido.fechaSugerida}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleAprobarPedido(pedido.id)}
                            disabled={cambiarEstadoPedidoMutation.isPending}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleRechazarPedido(pedido.id)}
                            disabled={cambiarEstadoPedidoMutation.isPending}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Rechazar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'consolidacion' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <DollarSign size={20} />
                      <h3 className="font-semibold">Ahorro Total Estimado por Consolidación</h3>
                    </div>
                    <p className="text-sm text-green-700">
                      Consolidando pedidos por proveedor se reduce el costo de transporte y gestión.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">
                      Bs {aglomeracion?.ahorroTotalEstimado.toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600">de ahorro</p>
                  </div>
                </div>
              </div>

              {aglomeracion?.consolidados.map((consolidado) => (
                <div key={consolidado.proveedorId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                          <Truck size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{consolidado.proveedorNombre}</h3>
                          <p className="text-sm text-gray-600">{consolidado.cantidadPedidos} pedidos pendientes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Ahorro:</p>
                        <p className="text-xl font-bold text-green-600">
                          Bs {consolidado.ahorro.ahorro.toFixed(2)} ({consolidado.ahorro.porcentajeAhorro.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <table className="w-full text-sm">
                      <thead className="text-gray-600 border-b">
                        <tr>
                          <th className="text-left py-2">Producto</th>
                          <th className="text-center py-2">Cant. Sugerida</th>
                          <th className="text-center py-2">Stock Actual</th>
                          <th className="text-center py-2">ROP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {consolidado.productos.map((producto) => (
                          <tr key={producto.productoId}>
                            <td className="py-3 font-medium text-gray-900">{producto.productoNombre}</td>
                            <td className="py-3 text-center font-bold text-blue-600">{producto.cantidadSugerida}</td>
                            <td className="py-3 text-center">{producto.stockActual}</td>
                            <td className="py-3 text-center">{producto.rop}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>Costo separado: <span className="font-semibold">Bs {consolidado.ahorro.costoSeparado.toFixed(2)}</span></p>
                        <p>Costo consolidado: <span className="font-semibold text-green-600">Bs {consolidado.ahorro.costoConsolidado.toFixed(2)}</span></p>
                      </div>
                      <button
                        onClick={() => handleAprobarConsolidacion(consolidado.proveedorId)}
                        disabled={cambiarEstadoPedidoMutation.isPending}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cambiarEstadoPedidoMutation.isPending ? 'Procesando...' : 'Aprobar Consolidación'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
