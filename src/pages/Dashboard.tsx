import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Users, Package, AlertCircle, ShoppingCart, Boxes } from 'lucide-react';
import { api } from '../services/api';
import type { DashboardEstadisticas, TopProductoStock, DistribucionStock, VentaReciente, SubloteProximoVencer } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
  onClick?: () => void;
}

const StatCard = ({ title, value, icon: Icon, color, trend, onClick }: StatCardProps) => (
  <div 
    className={`group relative bg-gradient-to-br from-white to-gray-50/50 p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-primary-200 transition-all duration-300 overflow-hidden ${
      onClick ? 'cursor-pointer hover:-translate-y-1' : ''
    }`}
    onClick={onClick}
  >
    {/* Decorative background gradient */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-50 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    <div className="relative flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide">{title}</p>
        <h3 className="text-3xl font-bold mt-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{value}</h3>
        {trend && (
          <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {trend}
          </p>
        )}
      </div>
      <div className={`relative p-4 rounded-xl ${color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-7 h-7 text-white" />
        <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  </div>
);

const COLORS = ['#a855f7', '#ec4899', '#8b5cf6', '#f97316', '#ef4444', '#d946ef'];

const getGradientColor = (baseColor: string) => {
  const gradients: Record<string, string> = {
    'bg-primary-500': 'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-purple-500': 'bg-gradient-to-br from-purple-400 to-fuchsia-600',
    'bg-emerald-500': 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    'bg-rose-500': 'bg-gradient-to-br from-rose-400 to-rose-600',
    'bg-blue-500': 'bg-gradient-to-br from-violet-400 to-purple-600',
    'bg-orange-500': 'bg-gradient-to-br from-orange-400 to-orange-600',
  };
  return gradients[baseColor] || baseColor;
};

export const Dashboard = () => {
  const navigate = useNavigate();
  
  // Query principal de estadísticas
  const { data: estadisticas } = useQuery<DashboardEstadisticas>({
    queryKey: ['dashboard-estadisticas'],
    queryFn: async () => {
      const res = await api.get('/dashboard/estadisticas');
      return res.data;
    }
  });

  // Top 5 productos con mayor stock
  const { data: topProductosStock } = useQuery<TopProductoStock[]>({
    queryKey: ['dashboard-top-productos-stock'],
    queryFn: async () => {
      const res = await api.get('/dashboard/top-productos-stock');
      return res.data;
    }
  });

  // Distribución de stock
  const { data: distribucionStock } = useQuery<DistribucionStock[]>({
    queryKey: ['dashboard-distribucion-stock'],
    queryFn: async () => {
      const res = await api.get('/dashboard/distribucion-stock');
      return res.data;
    }
  });

  // Ventas recientes
  const { data: ventasRecientes } = useQuery<VentaReciente[]>({
    queryKey: ['dashboard-ventas-recientes'],
    queryFn: async () => {
      const res = await api.get('/dashboard/ventas-recientes');
      return res.data;
    }
  });

  // Sublotes próximos a vencer
  const { data: sublotesProximosVencer } = useQuery<SubloteProximoVencer[]>({
    queryKey: ['dashboard-sublotes-proximos-vencer'],
    queryFn: async () => {
      const res = await api.get('/dashboard/sublotes-proximos-vencer');
      return res.data;
    }
  });

  // Queries antiguas (mantener para compatibilidad con productos count)
  const { data: productosCount } = useQuery({
    queryKey: ['productos-count'],
    queryFn: async () => {
      const res = await api.get<number>('/productos/count');
      return res.data;
    }
  });

  // Formatear datos para gráficos
  const chartTopProductos = topProductosStock?.map(p => ({
    nombre: p.nombreProducto.length > 20 ? p.nombreProducto.substring(0, 20) + '...' : p.nombreProducto,
    cantidad: p.stockTotal
  })) || [];

  const chartDistribucion = distribucionStock?.map(p => ({
    name: p.nombreProducto.length > 15 ? p.nombreProducto.substring(0, 15) + '...' : p.nombreProducto,
    value: p.stockTotal
  })) || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Ventas" 
          value={`${estadisticas?.totalVentas.toFixed(2) || 0} Bs`}
          icon={TrendingUp}
          color={getGradientColor('bg-primary-500')}
          trend={`${estadisticas?.numeroVentas || 0} transacciones`}
          onClick={() => navigate('/ventas')}
        />
        <StatCard 
          title="Clientes Registrados" 
          value={estadisticas?.clientesRegistrados || 0} 
          icon={Users}
          color={getGradientColor('bg-purple-500')}
          onClick={() => navigate('/clientes')}
        />
        <StatCard 
          title="Productos en Inventario" 
          value={productosCount || 0} 
          icon={Package}
          color={getGradientColor('bg-emerald-500')}
          onClick={() => navigate('/productos')}
        />
        <StatCard 
          title="Productos Bajo Stock" 
          value={estadisticas?.productosBajoStock || 0} 
          icon={AlertCircle}
          color={getGradientColor('bg-rose-500')}
          trend="< punto de reorden"
          onClick={() => navigate('/productos')}
        />
        <StatCard 
          title="Total Compras" 
          value={`${estadisticas?.totalCompras.toFixed(2) || 0} Bs`}
          icon={ShoppingCart}
          color={getGradientColor('bg-blue-500')}
          trend={`${estadisticas?.numeroCompras || 0} transacciones`}
          onClick={() => navigate('/compras')}
        />
        <StatCard 
          title="Productos por Vencer" 
          value={estadisticas?.productosProximosVencer || 0}
          icon={Boxes}
          color={getGradientColor('bg-orange-500')}
          color="bg-orange-500"
          trend="Próximos 30 días"
          onClick={() => navigate('/sublotes')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Stock */}
        <div className="bg-gradient-to-br from-white to-purple-50/30 p-6 rounded-2xl shadow-xl border border-purple-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-800">Top 5 Productos con Mayor Stock</h3>
          </div>
          <div className="h-80" style={{ minHeight: '320px' }}>
            {chartTopProductos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartTopProductos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="nombre" 
                  stroke="#9ca3af" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="cantidad" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Cargando datos...
              </div>
            )}
          </div>
        </div>

        {/* Stock Distribution Pie Chart */}
        <div className="bg-gradient-to-br from-white to-fuchsia-50/30 p-6 rounded-2xl shadow-xl border border-fuchsia-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-fuchsia-500 to-pink-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-800">Distribución de Stock</h3>
          </div>
          <div className="h-80" style={{ minHeight: '320px' }}>
            {chartDistribucion.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                  data={chartDistribucion}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartDistribucion.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Cargando datos...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-gradient-to-br from-white to-pink-50/30 rounded-2xl shadow-xl border border-pink-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="p-6 border-b border-pink-100/50 bg-gradient-to-r from-pink-50/50 to-transparent">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full" />
              <h3 className="text-lg font-bold text-gray-800">Ventas Recientes</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 font-medium">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ventasRecientes?.map((venta, idx) => (
                  <tr key={venta.ventaId || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">{venta.nombreCliente}</td>
                    <td className="px-6 py-3 text-xs">{new Date(venta.fechaVenta).toLocaleDateString('es-BO')}</td>
                    <td className="px-6 py-3 font-medium text-primary-600">{venta.totalVenta.toFixed(2)} Bs</td>
                  </tr>
                ))}
                {(!ventasRecientes || ventasRecientes.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No hay ventas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products about to expire */}
        <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl shadow-xl border border-orange-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="p-6 border-b border-orange-100/50 bg-gradient-to-r from-orange-50/50 to-transparent">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
              <h3 className="text-lg font-bold text-gray-800">Sublotes Próximos a Vencer</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 font-medium">
                <tr>
                  <th className="px-6 py-3">Producto</th>
                  <th className="px-6 py-3">Cantidad</th>
                  <th className="px-6 py-3">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sublotesProximosVencer?.map((sublote, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">{sublote.nombreProducto}</td>
                    <td className="px-6 py-3">{sublote.cantidad}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {sublote.fechaVencimiento}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!sublotesProximosVencer || sublotesProximosVencer.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No hay productos próximos a vencer
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {(estadisticas?.productosBajoStock || 0) > 0 && (
        <div className="relative bg-gradient-to-r from-pink-50 via-purple-50 to-fuchsia-50 border-l-4 border-purple-500 p-6 rounded-2xl shadow-lg overflow-hidden animate-slideIn">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-400 to-fuchsia-500 rounded-xl shadow-lg">
              <AlertCircle className="text-white" size={28} />
            </div>
            <div>
              <h3 className="text-purple-900 font-bold text-lg">Alerta de Stock Bajo</h3>
              <p className="text-purple-800 text-sm mt-1 font-medium">
                Hay {estadisticas?.productosBajoStock || 0} producto{(estadisticas?.productosBajoStock || 0) !== 1 ? 's' : ''} con stock bajo.
                Considera realizar un pedido de reposición.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
