import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Package, Users, MoreHorizontal } from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Accueil' },
  { path: '/caisse', icon: ShoppingBag, label: 'Caisse' },
  { path: '/stocks', icon: Package, label: 'Stocks' },
  { path: '/personnel', icon: Users, label: 'Personnel' },
  { path: '/plus', icon: MoreHorizontal, label: 'Plus' },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const hiddenPaths = ['/', '/landing'];
  if (hiddenPaths.includes(pathname)) return null;

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
