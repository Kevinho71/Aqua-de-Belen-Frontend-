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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
  onClick?: () => void;
}

interface ProductoStock {
  id: number;
  nombre: string;
  cantidadTotal: number;
}

interface Sublote {
  id: string;
  codigoSublote: string;
  producto: string;
  cantidadActual: string;
  fechaVencimiento: string;
  estado: string;
}

interface Venta {
  ventaId: string;
  cliente: string;
  totalNeto: string;
  fecha: string;
  conFactura: string;
}

interface Compra {
  id: string;
  proveedor: string;
  costoNeto: string;
  fecha: string;
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
  
  // Queries para estadísticas
  const { data: productosCount } = useQuery({
    queryKey: ['productos-count'],
    queryFn: async () => {
      const res = await api.get<number>('/productos/count');
      return res.data;
    }
  });

  const { data: productosStock } = useQuery({
    queryKey: ['productos-stock-total'],
    queryFn: async () => {
      const res = await api.get<ProductoStock[]>('/productos/stock-total');
      return res.data;
    }
  });

  const { data: sublotesProximosVencer } = useQuery({
    queryKey: ['sublotes-proximos-vencer'],
    queryFn: async () => {
      const res = await api.get<Sublote[]>('/sublotes/proximos-vencer', {
        params: { dias: 30 }
      });
      return res.data;
    }
  });

  const { data: ventas } = useQuery({
    queryKey: ['ventas'],
    queryFn: async () => {
      const res = await api.get<Venta[]>('/ventas');
      return res.data;
    }
  });

  const { data: compras } = useQuery({
    queryKey: ['compras'],
    queryFn: async () => {
      const res = await api.get<Compra[]>('/compras');
      return res.data;
    }
  });

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await api.get('/clientes');
      return res.data;
    }
  });

  // Calcular productos con bajo stock (menos de 10 unidades)
  const productosbajoStock = productosStock?.filter(p => p.cantidadTotal < 10).length || 0;

  // Calcular total de ventas en Bs
  const totalVentas = ventas?.reduce((sum, venta) => {
    const monto = parseFloat(venta.totalNeto.replace(/[^\d.-]/g, ''));
    return sum + (isNaN(monto) ? 0 : monto);
  }, 0) || 0;

  // Top 5 productos con más stock
  const topProductosStock = productosStock
    ?.sort((a, b) => b.cantidadTotal - a.cantidadTotal)
    .slice(0, 5)
    .map(p => ({
      nombre: p.nombre.length > 20 ? p.nombre.substring(0, 20) + '...' : p.nombre,
      cantidad: p.cantidadTotal
    })) || [];

  // Distribución de stock por producto (Top 6)
  const distribucionStock = productosStock
    ?.sort((a, b) => b.cantidadTotal - a.cantidadTotal)
    .slice(0, 6)
    .map(p => ({
      name: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre,
      value: p.cantidadTotal
    })) || [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Ventas" 
          value={`${totalVentas.toFixed(2)} Bs`}
          icon={TrendingUp}
          color="bg-primary-500"
          trend={`${ventas?.length || 0} transacciones`}
          onClick={() => navigate('/ventas')}
        />
        <StatCard 
          title="Clientes Registrados" 
          value={clientes?.length || 0} 
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
          value={productosbajoStock} 
          icon={AlertCircle}
          color="bg-rose-500"
          trend="< 10 unidades"
          onClick={() => navigate('/productos')}
        />
        <StatCard 
          title="Total Compras" 
          value={compras?.length || 0}
          icon={ShoppingCart}
          color="bg-blue-500"
          onClick={() => navigate('/compras')}
        />
        <StatCard 
          title="Productos por Vencer" 
          value={sublotesProximosVencer?.length || 0}
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
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductosStock}>
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
          </div>
        </div>

        {/* Stock Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-800">Distribución de Stock</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribucionStock}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distribucionStock.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
                {ventas?.slice(0, 5).map((venta, idx) => (
                  <tr key={venta.ventaId || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">{venta.cliente}</td>
                    <td className="px-6 py-3 text-xs">{venta.fecha}</td>
                    <td className="px-6 py-3 font-medium text-primary-600">{venta.totalNeto}</td>
                  </tr>
                ))}
                {(!ventas || ventas.length === 0) && (
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
                {sublotesProximosVencer?.slice(0, 5).map((sublote, idx) => (
                  <tr key={sublote.id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">{sublote.producto}</td>
                    <td className="px-6 py-3">{sublote.cantidadActual}</td>
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
      {productosbajoStock > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="text-yellow-600 mr-3" size={24} />
            <div>
              <h3 className="text-yellow-800 font-semibold">Alerta de Stock Bajo</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Hay {productosbajoStock} producto{productosbajoStock !== 1 ? 's' : ''} con menos de 10 unidades en stock.
                Considera realizar un pedido de reposición.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
