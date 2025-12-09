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
    className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${
      onClick ? 'cursor-pointer hover:border-primary-300' : ''
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-gray-900">{value}</h3>
        {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

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
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Ventas" 
          value={`${estadisticas?.totalVentas.toFixed(2) || 0} Bs`}
          icon={TrendingUp}
          color="bg-primary-500"
          trend={`${estadisticas?.numeroVentas || 0} transacciones`}
          onClick={() => navigate('/ventas')}
        />
        <StatCard 
          title="Clientes Registrados" 
          value={estadisticas?.clientesRegistrados || 0} 
          icon={Users}
          color="bg-purple-500"
          onClick={() => navigate('/clientes')}
        />
        <StatCard 
          title="Productos en Inventario" 
          value={productosCount || 0} 
          icon={Package}
          color="bg-emerald-500"
          onClick={() => navigate('/productos')}
        />
        <StatCard 
          title="Productos Bajo Stock" 
          value={estadisticas?.productosBajoStock || 0} 
          icon={AlertCircle}
          color="bg-rose-500"
          trend="< punto de reorden"
          onClick={() => navigate('/productos')}
        />
        <StatCard 
          title="Total Compras" 
          value={`${estadisticas?.totalCompras.toFixed(2) || 0} Bs`}
          icon={ShoppingCart}
          color="bg-blue-500"
          trend={`${estadisticas?.numeroCompras || 0} transacciones`}
          onClick={() => navigate('/compras')}
        />
        <StatCard 
          title="Productos por Vencer" 
          value={estadisticas?.productosProximosVencer || 0}
          icon={Boxes}
          color="bg-orange-500"
          trend="Próximos 30 días"
          onClick={() => navigate('/sublotes')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Stock */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-800">Top 5 Productos con Mayor Stock</h3>
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-800">Distribución de Stock</h3>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Ventas Recientes</h3>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Sublotes Próximos a Vencer</h3>
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
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="text-yellow-600 mr-3" size={24} />
            <div>
              <h3 className="text-yellow-800 font-semibold">Alerta de Stock Bajo</h3>
              <p className="text-yellow-700 text-sm mt-1">
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
