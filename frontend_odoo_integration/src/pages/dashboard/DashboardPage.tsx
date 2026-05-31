import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard';
import { syncApi } from '../../api/sync';
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Receipt,
  AlertTriangle,
  RefreshCw,
  Activity,
} from 'lucide-react';

function StatCard({ title, value, icon: Icon, color, hint }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-extrabold mt-1 tracking-tight">{value}</p>
          {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function BarRow({ label, value, max, rightText, color = 'bg-blue-500' }: {
  label: string;
  value: number;
  max: number;
  rightText: string;
  color?: string;
}) {
  const width = max <= 0 ? 0 : Math.max(4, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">{rightText}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-2 ${color}`} style={{ width: `${value <= 0 ? 0 : width}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [syncMessage, setSyncMessage] = useState<string>('');

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.getSummary,
    refetchInterval: 30000,
  });

  const topProductsQuery = useQuery({
    queryKey: ['dashboard-top-products'],
    queryFn: () => dashboardApi.getTopProducts(5),
    refetchInterval: 30000,
  });

  const opportunitiesQuery = useQuery({
    queryKey: ['dashboard-opportunities'],
    queryFn: dashboardApi.getOpportunities,
    refetchInterval: 30000,
  });

  const triggerSync = useMutation({
    mutationFn: syncApi.trigger,
    onSuccess: async () => {
      setSyncMessage('Sincronización completada');
      await Promise.all([
        summaryQuery.refetch(),
        topProductsQuery.refetch(),
        opportunitiesQuery.refetch(),
      ]);
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      if (status === 403) {
        setSyncMessage('No tienes permisos para sincronizar (solo admin).');
      } else {
        setSyncMessage('Error al sincronizar. Revisa logs del backend.');
      }
    },
  });

  const isLoading = summaryQuery.isLoading || topProductsQuery.isLoading || opportunitiesQuery.isLoading;

  const topProducts = topProductsQuery.data ?? [];
  const opportunities = opportunitiesQuery.data ?? [];
  const maxRevenue = useMemo(() => Math.max(...topProducts.map((p: any) => p.revenue), 0), [topProducts]);
  const maxOppRevenue = useMemo(() => Math.max(...opportunities.map((o: any) => o.total_revenue), 0), [opportunities]);

  if (isLoading) return <p className="text-gray-500">Cargando dashboard...</p>;

  const summary = summaryQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Vista ejecutiva con sincronización automática cada 30 segundos</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => {
              setSyncMessage('');
              triggerSync.mutate();
            }}
            disabled={triggerSync.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm disabled:opacity-60"
          >
            <RefreshCw size={16} className={triggerSync.isPending ? 'animate-spin' : ''} />
            {triggerSync.isPending ? 'Sincronizando...' : 'Sincronizar ahora'}
          </button>
          {syncMessage && <p className="text-xs text-gray-500">{syncMessage}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard title="Ventas" value={summary?.total_sales ?? 0} icon={BarChart3} color="bg-blue-500" />
        <StatCard title="Clientes" value={summary?.total_customers ?? 0} icon={Users} color="bg-green-500" />
        <StatCard title="Cotizaciones" value={summary?.total_quotations ?? 0} icon={FileText} color="bg-yellow-500" />
        <StatCard title="Oportunidades" value={summary?.total_opportunities ?? 0} icon={TrendingUp} color="bg-purple-500" />
        <StatCard title="Facturas" value={summary?.total_invoices ?? 0} icon={Receipt} color="bg-cyan-600" />
        <StatCard title="Facturas pendientes" value={summary?.unpaid_invoices ?? 0} icon={AlertTriangle} color="bg-red-500" hint="Requieren seguimiento" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={18} className="text-blue-600" />
            <h2 className="text-lg font-bold">Productos más vendidos (visual)</h2>
          </div>

          {topProducts.length ? (
            <div className="space-y-4">
              {topProducts.map((p: any) => (
                <BarRow
                  key={p.id}
                  label={p.name}
                  value={p.revenue}
                  max={maxRevenue}
                  rightText={`$${p.revenue.toFixed(2)} · ${p.qty} uds`}
                  color="bg-blue-500"
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aún no hay datos de ventas</p>
          )}
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-5">Oportunidades por etapa</h2>
          {opportunities.length ? (
            <div className="space-y-4">
              {opportunities.map((s: any) => (
                <BarRow
                  key={s.stage_id}
                  label={s.stage_name}
                  value={s.total_revenue}
                  max={maxOppRevenue}
                  rightText={`${s.count} leads · $${s.total_revenue.toFixed(0)}`}
                  color="bg-purple-500"
                />
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
