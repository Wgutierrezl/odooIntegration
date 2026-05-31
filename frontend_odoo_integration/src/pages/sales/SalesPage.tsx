import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '../../api/sales';
import { productsApi } from '../../api/products';
import { contactsApi } from '../../api/contacts';
import { ShoppingCart, X, FileText, Download, Check } from 'lucide-react';

interface CartItem {
  product_id: number;
  name: string;
  quantity: number;
  price_unit: number;
}

export default function SalesPage() {
  const [showPOS, setShowPOS] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesApi.list(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['pos-products', productSearch],
    queryFn: () => productsApi.list({ q: productSearch || undefined, limit: 20 }),
    enabled: showPOS,
  });

  const { data: customersData } = useQuery({
    queryKey: ['pos-customers'],
    queryFn: () => contactsApi.listCustomers({ limit: 100 }),
    enabled: showPOS,
  });

  const createSale = useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      setShowPOS(false);
      setCart([]);
      setSelectedCustomer(null);
    },
  });

  const confirmSale = useMutation({
    mutationFn: salesApi.confirm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
  });

  const createInvoice = useMutation({
    mutationFn: salesApi.createInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
  });

  const addToCart = (product: any) => {
    const existing = cart.find((c) => c.product_id === product.id);
    if (existing) {
      setCart(cart.map((c) => c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { product_id: product.id, name: product.name, quantity: 1, price_unit: product.list_price }]);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.quantity * item.price_unit, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ventas / POS</h1>
        <button onClick={() => setShowPOS(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <ShoppingCart size={16} /> Nueva venta
        </button>
      </div>

      {showPOS && (
        <div className="bg-white rounded-xl shadow-lg border mb-6 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Punto de venta</h2>
            <button onClick={() => setShowPOS(false)}><X size={20} /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                value={selectedCustomer ?? ''}
                onChange={(e) => setSelectedCustomer(+e.target.value)}
                className="w-full px-3 py-2 border rounded-lg outline-none mb-3"
              >
                <option value="">Selecciona cliente...</option>
                {customersData?.items?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <input
                placeholder="Buscar productos..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg outline-none mb-2"
              />
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {productsData?.items?.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-0 text-sm flex justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-gray-500">${p.list_price?.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Carrito</h3>
              <div className="border rounded-lg min-h-[200px] p-2">
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center mt-8">Agrega productos al carrito</p>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div key={item.product_id} className="flex items-center justify-between py-1 text-sm">
                        <span className="flex-1">{item.name}</span>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => setCart(cart.map((c) => c.product_id === item.product_id ? { ...c, quantity: +e.target.value } : c))}
                          className="w-16 px-2 py-1 border rounded text-center mx-2"
                        />
                        <span className="w-20 text-right">${(item.quantity * item.price_unit).toFixed(2)}</span>
                        <button onClick={() => setCart(cart.filter((c) => c.product_id !== item.product_id))} className="ml-2 text-red-400 hover:text-red-600">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  if (!selectedCustomer || cart.length === 0) return;
                  createSale.mutate({
                    partner_id: selectedCustomer,
                    lines: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity, price_unit: c.price_unit })),
                  });
                }}
                disabled={!selectedCustomer || cart.length === 0 || createSale.isPending}
                className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {createSale.isPending ? 'Creando...' : 'Crear orden de venta'}
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
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Estado factura</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {salesData?.items?.map((s: any) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.partner_id?.[1] ?? '—'}</td>
                  <td className="px-4 py-3">{s.user_id?.[1] ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      s.state === 'sale' ? 'bg-green-100 text-green-700' :
                      s.state === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{s.state}</span>
                  </td>
                  <td className="px-4 py-3">{s.invoice_status ?? '—'}</td>
                  <td className="px-4 py-3 text-right">${(s.amount_untaxed ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${s.amount_total?.toFixed(2)}</td>
                  <td className="px-4 py-3 flex gap-1">
                    {s.state === 'draft' && (
                      <button onClick={() => confirmSale.mutate(s.id)} className="p-1 hover:bg-green-50 rounded" title="Confirmar">
                        <Check size={16} className="text-green-600" />
                      </button>
                    )}
                    {(s.state === 'sale' || s.state === 'done') && (
                      <button onClick={() => createInvoice.mutate(s.id)} className="p-1 hover:bg-blue-50 rounded" title="Crear factura">
                        <FileText size={16} className="text-blue-600" />
                      </button>
                    )}
                    {s.invoice_ids?.length > 0 && (
                      <button onClick={() => salesApi.downloadInvoicePdf(s.id)} className="p-1 hover:bg-purple-50 rounded" title="Descargar PDF">
                        <Download size={16} className="text-purple-600" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!salesData?.items?.length && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No se encontraron ventas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
