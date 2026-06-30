import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationToaster from './components/NotificationToaster';
import AppErrorBoundary from './components/AppErrorBoundary';
import PageLoader from './components/PageLoader';
import { useThemeStore } from './stores/themeStore';
import { lazy, Suspense, useEffect } from 'react';
import { installGlobalTelemetry } from './services/telemetry';
import './index.css';

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Caisse = lazy(() => import('./pages/Caisse'));
const Stocks = lazy(() => import('./pages/Stocks'));
const Personnel = lazy(() => import('./pages/Personnel'));
const Rapports = lazy(() => import('./pages/Rapports'));
const Livraisons = lazy(() => import('./pages/Livraisons'));
const Commandes = lazy(() => import('./pages/Commandes'));
const Fidelite = lazy(() => import('./pages/Fidelite'));
const Plus = lazy(() => import('./pages/Plus'));
const Cuisine = lazy(() => import('./pages/Cuisine'));
const ClientHome = lazy(() => import('./pages/ClientHome'));
const Reservations = lazy(() => import('./pages/Reservations'));
const Wallet = lazy(() => import('./pages/Wallet'));
const ClientOrder = lazy(() => import('./pages/ClientOrder'));
const Review = lazy(() => import('./pages/Review'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const MenuBuilder = lazy(() => import('./pages/MenuBuilder'));
const Factures = lazy(() => import('./pages/Factures'));
const WhatsAppBot = lazy(() => import('./pages/WhatsAppBot'));
const HospiSettings = lazy(() => import('./pages/HospiSettings'));
const PMS = lazy(() => import('./pages/PMS'));
const BusinessModules = lazy(() => import('./pages/BusinessModules'));
const BusinessPOS = lazy(() => import('./pages/BusinessPOS'));
const DemoGuide = lazy(() => import('./pages/DemoGuide'));
const Workstation = lazy(() => import('./pages/Workstation'));

const staffRoles = ['Caissier', 'Serveur', 'Chef cuisine', 'Livreur', 'Réceptionniste', 'Gouvernante', 'Maintenance', 'Barman', 'Croupier', 'Praticien spa', 'Vendeur boutique', 'Stockiste', 'Acheteur'];

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  return (
    <>
      <AppErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant']}><Dashboard /></ProtectedRoute>
          } />
          <Route path="/modules" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant']}><BusinessModules /></ProtectedRoute>
          } />
          <Route path="/commandes" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Serveur']}><Commandes /></ProtectedRoute>
          } />
          <Route path="/caisse" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Caissier', 'Serveur', 'Réceptionniste', 'Barman', 'Croupier', 'Vendeur boutique']}><Caisse /></ProtectedRoute>
          } />
          <Route path="/cuisine" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Chef cuisine']}><Cuisine /></ProtectedRoute>
          } />
          <Route path="/stocks" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Chef cuisine', 'Barman', 'Vendeur boutique', 'Stockiste', 'Acheteur']}><Stocks /></ProtectedRoute>
          } />
          <Route path="/pms" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Caissier', 'Réceptionniste', 'Gouvernante', 'Maintenance']}><PMS /></ProtectedRoute>
          } />
          <Route path="/pos-metier" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Caissier', 'Serveur', 'Barman', 'Croupier', 'Praticien spa', 'Vendeur boutique']}><BusinessPOS /></ProtectedRoute>
          } />
          <Route path="/poste" element={
            <ProtectedRoute allowedRoles={staffRoles}><Workstation /></ProtectedRoute>
          } />
          <Route path="/personnel" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', ...staffRoles]}><Personnel /></ProtectedRoute>
          } />
          <Route path="/rapports" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant']}><Rapports /></ProtectedRoute>
          } />
          <Route path="/livraisons" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Livreur']}><Livraisons /></ProtectedRoute>
          } />
          <Route path="/client" element={
            <ProtectedRoute allowedRoles={['Client']}><ClientHome /></ProtectedRoute>
          } />
          <Route path="/reservations" element={
            <ProtectedRoute allowedRoles={['Client']}><Reservations /></ProtectedRoute>
          } />
          <Route path="/wallet" element={
            <ProtectedRoute allowedRoles={['Client']}><Wallet /></ProtectedRoute>
          } />
          <Route path="/fidelite" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Caissier', 'Serveur']}><Fidelite /></ProtectedRoute>
          } />
          <Route path="/plus" element={
            <ProtectedRoute><Plus /></ProtectedRoute>
          } />
          <Route path="/demo-guide" element={
            <ProtectedRoute><DemoGuide /></ProtectedRoute>
          } />
          <Route path="/client-order" element={<ClientOrder />} />
          <Route path="/client/review" element={<Review />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/menu-builder" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant']}><MenuBuilder /></ProtectedRoute>
          } />
          <Route path="/factures" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant']}><Factures /></ProtectedRoute>
          } />
          <Route path="/whatsapp-bot" element={
            <ProtectedRoute><WhatsAppBot /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant']}><HospiSettings /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </AppErrorBoundary>
      <NotificationToaster />
      {!isLanding && <BottomNav />}
    </>
  );
}

export default function App() {
  const { mode, accent } = useThemeStore();
  
  useEffect(() => {
    document.body.className = mode;
    document.documentElement.style.setProperty('--color-orange', accent);
  }, [mode, accent]);

  useEffect(() => installGlobalTelemetry(), []);

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
