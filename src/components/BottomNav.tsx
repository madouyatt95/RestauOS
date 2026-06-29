import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Package, Users, MoreHorizontal, Truck, ChefHat, Calendar, Wallet, Grid2X2, BarChart3, Settings } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usePlanningStore } from '../stores/planningStore';

export default function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const { checkIsOffShift } = usePlanningStore();
  const hiddenPaths = ['/', '/landing', '/whatsapp-bot'];
  if (hiddenPaths.includes(pathname)) return null;

  let navItems = [];

  switch (user?.role) {
    case 'Admin':
    case 'Gérant':
      navItems = [
        { path: '/dashboard', icon: Home, label: 'Accueil' },
        { path: '/modules', icon: Grid2X2, label: 'Activités' },
        { path: '/commandes', icon: ShoppingBag, label: 'Opérations' },
        { path: '/rapports', icon: BarChart3, label: 'Rapports' },
        { path: '/settings', icon: Settings, label: 'Admin' },
        { path: '/plus', icon: MoreHorizontal, label: 'Profil' },
      ];


      break;
    case 'Caissier':
      navItems = [
        { path: '/caisse', icon: ShoppingBag, label: 'Encaissement' },
        { path: '/fidelite', icon: Users, label: 'Fidélité' },
        { path: '/personnel', icon: Calendar, label: 'Planning' },
        { path: '/plus', icon: MoreHorizontal, label: 'Plus' },
      ];
      break;
    case 'Serveur':
      navItems = [
        { path: '/commandes', icon: ShoppingBag, label: 'Salle' },
        { path: '/caisse', icon: Wallet, label: 'Caisse' },
        { path: '/fidelite', icon: Users, label: 'Fidélité' },
        { path: '/personnel', icon: Calendar, label: 'Planning' },
        { path: '/plus', icon: MoreHorizontal, label: 'Plus' },
      ];
      break;
    case 'Chef cuisine':
      navItems = [
        { path: '/cuisine', icon: ChefHat, label: 'Cuisine' },
        { path: '/stocks', icon: Package, label: 'Stocks' },
        { path: '/personnel', icon: Calendar, label: 'Planning' },
        { path: '/plus', icon: MoreHorizontal, label: 'Plus' },
      ];
      break;
    case 'Livreur':
      navItems = [
        { path: '/livraisons', icon: Truck, label: 'Livraisons' },
        { path: '/personnel', icon: Calendar, label: 'Planning' },
        { path: '/plus', icon: MoreHorizontal, label: 'Plus' },
      ];
      break;
    case 'Client':
      navItems = [
        { path: '/client', icon: Home, label: 'Accueil' },
        { path: '/reservations', icon: Calendar, label: 'Réserver' },
        { path: '/wallet', icon: Wallet, label: 'Wallet' },
      ];
      break;
    default:
      return null;
  }

  // Shift-based Filtering
  const operationalRoles = ['Serveur', 'Chef cuisine', 'Caissier', 'Livreur'];
  if (user && operationalRoles.includes(user.role) && user.employeeId && !user.shiftOverride) {
    const isOffShift = checkIsOffShift(user.employeeId);
    if (isOffShift) {
      navItems = navItems.filter(item => item.path === '/personnel' || item.path === '/plus');
    }
  }

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
