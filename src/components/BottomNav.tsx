import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Package, Users, MoreHorizontal, Truck, ChefHat, Calendar, Wallet, BedDouble, Dice5, Sparkles, Store } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usePlanningStore } from '../stores/planningStore';
import { canAccessRoute } from '../utils/accessControl';
import type { LucideIcon } from 'lucide-react';

type NavItem = { path: string; icon: LucideIcon; label: string };

export default function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const { checkIsOffShift } = usePlanningStore();
  const hiddenPaths = ['/', '/landing', '/whatsapp-bot'];
  if (hiddenPaths.includes(pathname)) return null;

  let navItems: NavItem[];
  const modules = user?.businessModules || [];
  const hasModule = (module: string) => modules.includes(module as never);
  const isFocusedManager = user?.accessLevel === 'business_manager' || user?.accessLevel === 'pos_manager';
  const isRoomServiceOnly = (user?.posIds || []).length > 0
    && (user?.posIds || []).every(posId => posId.includes('room-service') || posId.includes('minibar'));
  const primaryBusinessItem = (): NavItem => {
    if ((hasModule('hotel') && !hasModule('restaurant') && !hasModule('casino') && !hasModule('spa') && !hasModule('boutique')) || isRoomServiceOnly) {
      return { path: '/pms', icon: BedDouble, label: 'Hôtel' };
    }
    if (hasModule('spa')) return { path: '/pos-metier', icon: Sparkles, label: 'Spa' };
    if (hasModule('boutique')) return { path: '/pos-metier', icon: Store, label: 'Boutique' };
    if (hasModule('casino')) return { path: '/pos-metier', icon: Dice5, label: 'Casino' };
    return { path: '/commandes', icon: ShoppingBag, label: 'Restaurant' };
  };

  switch (user?.role) {
    case 'Admin':
    case 'Gérant':
      navItems = isFocusedManager
        ? [
            primaryBusinessItem(),
            { path: '/caisse', icon: Wallet, label: 'Caisse' },
            { path: '/stocks', icon: Package, label: 'Stock' },
            { path: '/personnel', icon: Calendar, label: 'Équipe' },
            { path: '/plus', icon: MoreHorizontal, label: 'Profil' },
          ]
        : [
            { path: '/dashboard', icon: Home, label: 'Direction' },
            { path: '/commandes', icon: ShoppingBag, label: 'Restaurant' },
            { path: '/pms', icon: BedDouble, label: 'Hôtel' },
            { path: '/stocks', icon: Package, label: 'Stocks' },
            { path: '/plus', icon: MoreHorizontal, label: 'Profil' },
          ];


      break;
    case 'Caissier':
      navItems = hasModule('restaurant')
        ? [
            { path: '/caisse', icon: ShoppingBag, label: 'Caisse' },
            { path: '/pos-metier', icon: Dice5, label: 'Bar' },
            { path: '/fidelite', icon: Users, label: 'Clients' },
            { path: '/personnel', icon: Calendar, label: 'Planning' },
            { path: '/plus', icon: MoreHorizontal, label: 'Profil' },
          ]
        : [
            primaryBusinessItem(),
            { path: '/caisse', icon: ShoppingBag, label: 'Caisse' },
            { path: '/personnel', icon: Calendar, label: 'Planning' },
            { path: '/plus', icon: MoreHorizontal, label: 'Profil' },
          ];
      break;
    case 'Serveur':
      navItems = (hasModule('hotel') && !hasModule('restaurant')) || isRoomServiceOnly
        ? [
            { path: '/pos-metier', icon: BedDouble, label: 'Room service' },
            { path: '/personnel', icon: Calendar, label: 'Planning' },
            { path: '/plus', icon: MoreHorizontal, label: 'Profil' },
          ]
        : [
            { path: '/commandes', icon: ShoppingBag, label: 'Salle' },
            { path: '/caisse', icon: Wallet, label: 'Caisse' },
            { path: '/fidelite', icon: Users, label: 'Clients' },
            { path: '/personnel', icon: Calendar, label: 'Planning' },
            { path: '/plus', icon: MoreHorizontal, label: 'Profil' },
          ];
      break;
    case 'Chef cuisine':
      navItems = [
        { path: '/cuisine', icon: ChefHat, label: 'Cuisine' },
        { path: '/stocks', icon: Package, label: 'Stocks' },
        { path: '/personnel', icon: Calendar, label: 'Planning' },
        { path: '/plus', icon: MoreHorizontal, label: 'Profil' },
      ];
      break;
    case 'Livreur':
      navItems = [
        { path: '/livraisons', icon: Truck, label: 'Livraisons' },
        { path: '/personnel', icon: Calendar, label: 'Planning' },
        { path: '/plus', icon: MoreHorizontal, label: 'Profil' },
      ];
      break;
    case 'Client':
      navItems = [
        { path: '/client', icon: Home, label: 'Accueil' },
        { path: '/reservations', icon: Calendar, label: 'Réserver' },
        { path: '/wallet', icon: Wallet, label: 'Wallet' },
        { path: '/plus', icon: MoreHorizontal, label: 'Profil' },
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

  navItems = navItems.filter(item => canAccessRoute(user, item.path));

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
