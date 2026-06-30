import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationToaster from './components/NotificationToaster';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Caisse from './pages/Caisse';
import Stocks from './pages/Stocks';
import Personnel from './pages/Personnel';
import Rapports from './pages/Rapports';
import Livraisons from './pages/Livraisons';
import Commandes from './pages/Commandes';
import Fidelite from './pages/Fidelite';
import Plus from './pages/Plus';
import Cuisine from './pages/Cuisine';
import ClientHome from './pages/ClientHome';
import Reservations from './pages/Reservations';
import Wallet from './pages/Wallet';
import ClientOrder from './pages/ClientOrder';
import Review from './pages/Review';
import Onboarding from './pages/Onboarding';
import MenuBuilder from './pages/MenuBuilder';
import Factures from './pages/Factures';
import WhatsAppBot from './pages/WhatsAppBot';
import HospiSettings from './pages/HospiSettings';
import PMS from './pages/PMS';
import BusinessModules from './pages/BusinessModules';
import BusinessPOS from './pages/BusinessPOS';
import DemoGuide from './pages/DemoGuide';
import { useThemeStore } from './stores/themeStore';
import { useEffect } from 'react';
import './index.css';

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  return (
    <>
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
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Caissier', 'Serveur']}><Caisse /></ProtectedRoute>
          } />
          <Route path="/cuisine" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Chef cuisine']}><Cuisine /></ProtectedRoute>
          } />
          <Route path="/stocks" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Chef cuisine']}><Stocks /></ProtectedRoute>
          } />
          <Route path="/pms" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Caissier']}><PMS /></ProtectedRoute>
          } />
          <Route path="/pos-metier" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Caissier', 'Serveur']}><BusinessPOS /></ProtectedRoute>
          } />
          <Route path="/personnel" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Caissier', 'Serveur', 'Chef cuisine', 'Livreur']}><Personnel /></ProtectedRoute>
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

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
