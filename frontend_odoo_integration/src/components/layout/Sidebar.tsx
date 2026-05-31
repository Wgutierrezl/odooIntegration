import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  UserCog,
  Briefcase,
  LogOut,
} from 'lucide-react';
import { branding, t } from '../../config/branding';

const navItems = [
  { to: '/', label: t.dashboard, icon: LayoutDashboard, roles: ['admin', 'manager'] },
  { to: '/products', label: t.products, icon: Package, roles: ['admin', 'manager', 'seller'] },
  { to: '/customers', label: t.customers, icon: Users, roles: ['admin', 'manager', 'seller'] },
  { to: '/suppliers', label: t.suppliers, icon: Users, roles: ['admin', 'manager'] },
  { to: '/sales', label: t.salesPos, icon: ShoppingCart, roles: ['admin', 'manager', 'seller'] },
  { to: '/crm', label: t.crmPipeline, icon: TrendingUp, roles: ['admin', 'manager'] },
  { to: '/employees', label: t.employees, icon: Briefcase, roles: ['admin', 'manager'] },
  { to: '/users', label: t.userManagement, icon: UserCog, roles: ['admin'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const filtered = navItems.filter((item) =>
    item.roles.includes(user?.role ?? ''),
  );

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <img src={branding.logoUrl} alt={branding.companyName} className="h-9 w-9 rounded-md bg-white p-1" />
          <div>
            <h1 className="text-sm font-semibold leading-tight">{branding.platformName}</h1>
            <p className="text-[11px] text-gray-400">{branding.companyName}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">{user?.full_name}</p>
        <p className="text-xs text-gray-500">{user?.role}</p>
      </div>

      <nav className="flex-1 p-2">
        {filtered.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full"
        >
          <LogOut size={18} />
          {t.logout}
        </button>
      </div>
    </aside>
  );
}
