import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchasesApi } from '../../api/purchases';
import { contactsApi } from '../../api/contacts';
import { productsApi } from '../../api/products';
import { Check, Plus, ShoppingBag, X } from 'lucide-react';

interface PurchaseItem {
  product_id: number;
  name: string;
  quantity: number;
  price_unit: number;
}

export default function PurchasesPage() {
  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const queryClient = useQueryClient();

  const { data: purchasesData, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => purchasesApi.list(),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['purchase-suppliers'],
    queryFn: () => contactsApi.listSuppliers({ limit: 200 }),
    enabled: showForm,
  });

  const { data: productsData } = useQuery({
    queryKey: ['purchase-products', search],
    queryFn: () => productsApi.list({ q: search || undefined, limit: 30 }),
    enabled: showForm,
  });

  const createPurchase = useMutation({
    mutationFn: purchasesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      setShowForm(false);
      setSupplierId(null);
      setItems([]);
      setSearch('');
      setAutoConfirm(true);
    },
  });

  const confirmPurchase = useMutation({
    mutationFn: purchasesApi.confirm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchases'] }),
  });

  const addItem = (product: any) => {
    const exists = items.find((i) => i.product_id === product.id);
    if (exists) {
      setItems(items.map((i) => (i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i)));
      return;
    }
    setItems([
      ...items,
      {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        price_unit: product.standard_price ?? product.list_price ?? 0,
      },
    ]);
  };

  const total = items.reduce((sum, i) => sum + i.quantity * i.price_unit, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Compras</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <Plus size={16} /> Nueva compra
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border mb-6 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Generar orden de compra (Admin)</h2>
            <button onClick={() => setShowForm(false)}><X size={20} /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Proveedor</label>
              <select
                value={supplierId ?? ''}
                onChange={(e) => setSupplierId(+e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-3"
              >
                <option value="">Selecciona proveedor...</option>
                {suppliersData?.items?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full px-3 py-2 border rounded-lg mb-2"
              />

              <div className="max-h-52 overflow-y-auto border rounded-lg">
                {productsData?.items?.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => addItem(p)}
                    className="w-full text-left px-3 py-2 border-b last:border-0 hover:bg-blue-50 flex justify-between text-sm"
                  >
                    <span>{p.name}</span>
                    <span className="text-gray-500">${(p.standard_price ?? p.list_price ?? 0).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Productos a comprar</h3>
              <div className="border rounded-lg min-h-[220px] p-2">
                {items.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center mt-10">Agrega productos a la orden</p>
                ) : (
                  <>
                    {items.map((item) => (
                      <div key={item.product_id} className="flex items-center justify-between py-1 text-sm">
                        <span className="flex-1">{item.name}</span>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => setItems(items.map((i) => i.product_id === item.product_id ? { ...i, quantity: +e.target.value } : i))}
                          className="w-16 px-2 py-1 border rounded mx-2 text-center"
                        />
                        <span className="w-24 text-right">${(item.quantity * item.price_unit).toFixed(2)}</span>
                        <button onClick={() => setItems(items.filter((i) => i.product_id !== item.product_id))} className="ml-2 text-red-400 hover:text-red-600">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 flex items-center justify-between font-semibold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm mt-3">
                <input type="checkbox" checked={autoConfirm} onChange={(e) => setAutoConfirm(e.target.checked)} />
                Confirmar automáticamente la orden en Odoo
              </label>

              <button
                onClick={() => {
                  if (!supplierId || items.length === 0) return;
                  createPurchase.mutate({
                    partner_id: supplierId,
                    lines: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, price_unit: i.price_unit })),
                    auto_confirm: autoConfirm,
                  });
                }}
                disabled={!supplierId || items.length === 0 || createPurchase.isPending}
                className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {createPurchase.isPending ? 'Generando...' : 'Generar orden de compra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Orden</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Estado factura</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {purchasesData?.items?.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.partner_id?.[1] ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.date_order?.split(' ')[0] ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${p.state === 'purchase' || p.state === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.state}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.invoice_status ?? '—'}</td>
                  <td className="px-4 py-3 text-right">${(p.amount_total ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {(p.state === 'draft' || p.state === 'sent') && (
                      <button onClick={() => confirmPurchase.mutate(p.id)} className="p-1 hover:bg-green-50 rounded" title="Confirmar orden">
                        <Check size={16} className="text-green-600" />
                      </button>
                    )}
                    {(p.state === 'purchase' || p.state === 'done') && (
                      <ShoppingBag size={16} className="text-blue-600" />
                    )}
                  </td>
                </tr>
              ))}
              {!purchasesData?.items?.length && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay órdenes de compra</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
