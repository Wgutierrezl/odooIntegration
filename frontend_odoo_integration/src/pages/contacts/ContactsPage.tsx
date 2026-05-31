import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contactsApi } from '../../api/contacts';
import { Search } from 'lucide-react';

function typeBadge(c: any) {
  if (c.contact_type === 'customer_supplier') return 'bg-indigo-100 text-indigo-700';
  if (c.contact_type === 'customer') return 'bg-green-100 text-green-700';
  if (c.contact_type === 'supplier') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-700';
}

function typeLabel(c: any) {
  if (c.contact_type === 'customer_supplier') return 'Cliente/Proveedor';
  if (c.contact_type === 'customer') return 'Cliente';
  if (c.contact_type === 'supplier') return 'Proveedor';
  return 'Contacto';
}

export default function ContactsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['contacts-all', search],
    queryFn: () => contactsApi.listAll({ q: search || undefined, limit: 120 }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contactos</h1>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar contactos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {isLoading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Ciudad</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${typeBadge(c)}`}>{typeLabel(c)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.city || '—'}</td>
                </tr>
              ))}
              {!data?.items?.length && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay contactos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
