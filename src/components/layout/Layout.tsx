import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ShoppingBag, 
  Users, 
  Truck, 
  Layers, 
  Box,
  Activity,
  Menu,
  X,
  BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';

const SidebarItem = ({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active: boolean }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
      active 
        ? "bg-primary-100 text-primary-700 font-medium" 
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    )}
  >
    <Icon size={20} />
    <span>{label}</span>
  </Link>
);

export const Layout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: BarChart3, label: 'KPIs Inventario', to: '/inventario-kpis' },
    { icon: Package, label: 'Productos', to: '/productos' },
    { icon: ShoppingCart, label: 'Ventas', to: '/ventas' },
    { icon: ShoppingBag, label: 'Compras', to: '/compras' },
    { icon: Users, label: 'Clientes', to: '/clientes' },
    { icon: Truck, label: 'Proveedores', to: '/proveedores' },
    { icon: Layers, label: 'Lotes', to: '/lotes' },
    { icon: Box, label: 'Sublotes', to: '/sublotes' },
    { icon: Activity, label: 'Movimientos', to: '/movimientos' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full lg:hidden"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-primary-600">Aqua de Belén</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <SidebarItem
              key={item.to}
              {...item}
              active={location.pathname === item.to}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 lg:px-8">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className={cn("mr-4 text-gray-500 lg:hidden", isSidebarOpen && "hidden")}
          >
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            {navItems.find(i => i.to === location.pathname)?.label || 'Dashboard'}
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
