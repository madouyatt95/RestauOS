import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Caisse from './pages/Caisse';
import Stocks from './pages/Stocks';
import Personnel from './pages/Personnel';
import Rapports from './pages/Rapports';
import Livraisons from './pages/Livraisons';
import Fidelite from './pages/Fidelite';
import Plus from './pages/Plus';
import Cuisine from './pages/Cuisine';
import ClientHome from './pages/ClientHome';
import Reservations from './pages/Reservations';
import Wallet from './pages/Wallet';
import './index.css';

function AppContent() {
  const isLanding = window.location.pathname === '/';
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant']}><Dashboard /></ProtectedRoute>
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
          <Route path="/personnel" element={
            <ProtectedRoute allowedRoles={['Admin', 'Gérant', 'Caissier', 'Serveur', 'Chef cuisine']}><Personnel /></ProtectedRoute>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      {!isLanding && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
