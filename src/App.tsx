import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BottomNav from './components/BottomNav';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Caisse from './pages/Caisse';
import Stocks from './pages/Stocks';
import Personnel from './pages/Personnel';
import Rapports from './pages/Rapports';
import Livraisons from './pages/Livraisons';
import Fidelite from './pages/Fidelite';
import Plus from './pages/Plus';
import './index.css';

function AppContent() {
  const isLanding = window.location.pathname === '/';
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/caisse" element={<Caisse />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/personnel" element={<Personnel />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/livraisons" element={<Livraisons />} />
          <Route path="/fidelite" element={<Fidelite />} />
          <Route path="/plus" element={<Plus />} />
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
