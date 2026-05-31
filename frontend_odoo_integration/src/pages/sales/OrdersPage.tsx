import { useQuery } from '@tanstack/react-query';
import { salesApi } from '../../api/sales';

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => salesApi.listOrders(),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Órdenes de venta</h1>
      {isLoading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Orden</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Estado factura</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((o: any) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{o.name}</td>
                  <td className="px-4 py-3">{o.partner_id?.[1] ?? '—'}</td>
                  <td className="px-4 py-3">{o.invoice_status ?? '—'}</td>
                  <td className="px-4 py-3 text-right">${(o.amount_total ?? 0).toFixed(2)}</td>
                </tr>
              ))}
              {!data?.items?.length && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay órdenes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
