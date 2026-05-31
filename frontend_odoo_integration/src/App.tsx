import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProductsPage from './pages/products/ProductsPage'
import ContactsPage from './pages/contacts/ContactsPage'
import CustomersPage from './pages/contacts/CustomersPage'
import SuppliersPage from './pages/contacts/SuppliersPage'
import SalesPage from './pages/sales/SalesPage'
import QuotationsPage from './pages/sales/QuotationsPage'
import OrdersPage from './pages/sales/OrdersPage'
import PurchasesPage from './pages/purchases/PurchasesPage'
import CrmPage from './pages/crm/CrmPage'
import EmployeesPage from './pages/employees/EmployeesPage'
import UsersPage from './pages/users/UsersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/crm" element={<CrmPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
    </Routes>
  )
}
