import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/products';
import { Search, Plus, X } from 'lucide-react';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', list_price: 0, default_code: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.list({ q: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setForm({ name: '', list_price: 0, default_code: '' });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Nuevo producto</h3>
            <button onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
            className="grid grid-cols-3 gap-3"
          >
            <input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded-lg outline-none" required />
            <input type="number" placeholder="Precio" value={form.list_price || ''} onChange={(e) => setForm({ ...form, list_price: +e.target.value })} className="px-3 py-2 border rounded-lg outline-none" required />
            <input placeholder="Código" value={form.default_code} onChange={(e) => setForm({ ...form, default_code: e.target.value })} className="px-3 py-2 border rounded-lg outline-none" />
            <button type="submit" disabled={createMutation.isPending} className="col-span-3 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {createMutation.isPending ? 'Creando...' : 'Crear en Odoo'}
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Precio venta</th>
                <th className="px-4 py-3 text-right">Costo</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Pronóstico</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{p.id}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.default_code || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.categ_id?.[1] || '—'}</td>
                  <td className="px-4 py-3 text-right">${(p.list_price ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${(p.standard_price ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{p.qty_available ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{p.virtual_available ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
