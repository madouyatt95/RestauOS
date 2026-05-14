import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Package, Users, MoreHorizontal, Truck, ChefHat } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const hiddenPaths = ['/', '/landing'];
  if (hiddenPaths.includes(pathname)) return null;

  let navItems = [];

  switch (user?.role) {
    case 'Admin':
    case 'Gérant':
      navItems = [
        { path: '/dashboard', icon: Home, label: 'Accueil' },
        { path: '/caisse', icon: ShoppingBag, label: 'Caisse' },
        { path: '/stocks', icon: Package, label: 'Stocks' },
        { path: '/personnel', icon: Users, label: 'Personnel' },
        { path: '/plus', icon: MoreHorizontal, label: 'Plus' },
      ];
      break;
    case 'Caissier':
    case 'Serveur':
      navItems = [
        { path: '/caisse', icon: ShoppingBag, label: 'Caisse' },
        { path: '/fidelite', icon: Users, label: 'Fidélité' },
        { path: '/plus', icon: MoreHorizontal, label: 'Plus' },
      ];
      break;
    case 'Chef cuisine':
      navItems = [
        { path: '/cuisine', icon: ChefHat, label: 'Cuisine' },
        { path: '/stocks', icon: Package, label: 'Stocks' },
        { path: '/plus', icon: MoreHorizontal, label: 'Plus' },
      ];
      break;
    case 'Livreur':
      navItems = [
        { path: '/livraisons', icon: Truck, label: 'Livraisons' },
        { path: '/plus', icon: MoreHorizontal, label: 'Plus' },
      ];
      break;
    case 'Client':
      navItems = [
        { path: '/client', icon: Home, label: 'Accueil' },
        { path: '/fidelite', icon: Users, label: 'Fidélité' },
        { path: '/plus', icon: MoreHorizontal, label: 'Plus' },
      ];
      break;
    default:
      return null;
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
