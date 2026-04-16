import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LogoProvider } from './contexts/LogoContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';
import { AccountingPage } from './pages/AccountingPage';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const CreateCustomerPage = lazy(() => import('./pages/CreateCustomerPage').then(m => ({ default: m.CreateCustomerPage })));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const CreateFlightInvoicePage = lazy(() => import('./pages/CreateFlightInvoicePage').then(m => ({ default: m.CreateFlightInvoicePage })));
const CreateHotelInvoicePage = lazy(() => import('./pages/CreateHotelInvoicePage').then(m => ({ default: m.CreateHotelInvoicePage })));
const CreatePackageInvoicePage = lazy(() => import('./pages/CreatePackageInvoicePage').then(m => ({ default: m.CreatePackageInvoicePage })));
const InvoiceDetailPage = lazy(() => import('./pages/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })));
const InvoiceDesignerPage = lazy(() => import('./pages/InvoiceDesignerPage').then(m => ({ default: m.InvoiceDesignerPage })));
const TokenPage = lazy(() => import('./pages/TokenPage').then(m => ({ default: m.TokenPage })));
const AgencyProfilePage = lazy(() => import('./pages/AgencyProfilePage').then(m => ({ default: m.AgencyProfilePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PaymentDetailPage = lazy(() => import('./pages/PaymentDetailPage').then(m => ({ default: m.PaymentDetailPage })));
const PdfImportPage = lazy(() => import('./pages/PdfImportPage').then(m => ({ default: m.PdfImportPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <LogoProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/customers/new" element={<CreateCustomerPage />} />
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/invoices/new/flight" element={<CreateFlightInvoicePage />} />
                  <Route path="/invoices/new/hotel" element={<CreateHotelInvoicePage />} />
                  <Route path="/invoices/new/package" element={<CreatePackageInvoicePage />} /><Route path="/accounting" element={<AccountingPage />} />
                  <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                  <Route path="/invoices/designer" element={<InvoiceDesignerPage />} />
                  <Route path="/payment/:id" element={<PaymentDetailPage />} />
                  <Route path="/pdf-import" element={<PdfImportPage />} />
                  <Route path="/tokens" element={<TokenPage />} />
                  <Route path="/agency" element={<AgencyProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </LogoProvider>

          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
