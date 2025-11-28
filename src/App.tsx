import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { DashboardInventario } from './pages/DashboardInventario';
import { Productos } from './pages/Productos';
import { Ventas } from './pages/Ventas';
import { Compras } from './pages/Compras';
import { Clientes } from './pages/Clientes';
import { Proveedores } from './pages/Proveedores';
import { Lotes } from './pages/Lotes';
import { Sublotes } from './pages/Sublotes';
import { Movimientos } from './pages/Movimientos';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inventario-kpis" element={<DashboardInventario />} />
            <Route path="productos" element={<Productos />} />
            <Route path="ventas" element={<Ventas />} />
            <Route path="compras" element={<Compras />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="lotes" element={<Lotes />} />
            <Route path="sublotes" element={<Sublotes />} />
            <Route path="movimientos" element={<Movimientos />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
