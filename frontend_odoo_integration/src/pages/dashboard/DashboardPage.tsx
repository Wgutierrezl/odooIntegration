import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard';
import { BarChart3, Users, FileText, TrendingUp, Receipt, AlertTriangle } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.getSummary,
  });

  const { data: topProducts } = useQuery({
    queryKey: ['dashboard-top-products'],
    queryFn: () => dashboardApi.getTopProducts(5),
  });

  const { data: opportunities } = useQuery({
    queryKey: ['dashboard-opportunities'],
    queryFn: dashboardApi.getOpportunities,
  });

  if (isLoading) return <p className="text-gray-500">Cargando dashboard...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Ventas" value={summary?.total_sales ?? 0} icon={BarChart3} color="bg-blue-500" />
        <StatCard title="Clientes" value={summary?.total_customers ?? 0} icon={Users} color="bg-green-500" />
        <StatCard title="Cotizaciones" value={summary?.total_quotations ?? 0} icon={FileText} color="bg-yellow-500" />
        <StatCard title="Oportunidades" value={summary?.total_opportunities ?? 0} icon={TrendingUp} color="bg-purple-500" />
        <StatCard title="Facturas" value={summary?.total_invoices ?? 0} icon={Receipt} color="bg-cyan-600" />
        <StatCard title="Facturas pendientes" value={summary?.unpaid_invoices ?? 0} icon={AlertTriangle} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Productos más vendidos</h2>
          {topProducts?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Producto</th>
                  <th className="pb-2 text-right">Cantidad</th>
                  <th className="pb-2 text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p: any) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-right">{p.qty}</td>
                    <td className="py-2 text-right">${p.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400 text-sm">Aún no hay datos de ventas</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Oportunidades por etapa</h2>
          {opportunities?.length ? (
            <div className="space-y-3">
              {opportunities.map((s: any) => (
                <div key={s.stage_id} className="flex items-center justify-between">
                  <span className="text-sm">{s.stage_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{s.count} leads</span>
                    <span className="text-sm font-medium">${s.total_revenue.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aún no hay datos de CRM</p>
          )}
        </div>
      </div>
    </div>
  );
}
