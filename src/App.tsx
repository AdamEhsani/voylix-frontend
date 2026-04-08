import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CreateCustomerPage } from './pages/CreateCustomerPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { CreateFlightInvoicePage } from './pages/CreateFlightInvoicePage';
import { CreateHotelInvoicePage } from './pages/CreateHotelInvoicePage';
import { CreatePackageInvoicePage } from './pages/CreatePackageInvoicePage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { InvoiceDesignerPage } from './pages/InvoiceDesignerPage';
import { TokenPage } from './pages/TokenPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AgencyProfilePage } from './pages/AgencyProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { PaymentDetailPage } from './pages/PaymentDetailPage';
import { PdfImportPage } from './pages/PdfImportPage';
import { Toaster } from 'sonner';
import { LogoProvider } from "./contexts/LogoContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <LogoProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<DashboardLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/new" element={<CreateCustomerPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/new/flight" element={<CreateFlightInvoicePage />} />
                <Route path="/invoices/new/hotel" element={<CreateHotelInvoicePage />} />
                <Route path="/invoices/new/package" element={<CreatePackageInvoicePage />} />
                <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="/invoices/designer" element={<InvoiceDesignerPage />} />
                <Route path="/payment/:id" element={<PaymentDetailPage />} />
                <Route path="/pdf-import" element={<PdfImportPage />} />
                <Route path="/tokens" element={<TokenPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/agency" element={<AgencyProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LogoProvider>

          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}