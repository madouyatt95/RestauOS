import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useHospiStore, type PermissionMode } from '../stores/hospiStore';
import { usePlanningStore } from '../stores/planningStore';
import { canAccessRoute, isDirection } from '../utils/accessControl';

const routePermissionActions: Array<{ prefix: string; action: string }> = [
  { prefix: '/settings', action: 'Admin Hospi' },
  { prefix: '/modules', action: 'Modules métiers' },
  { prefix: '/dashboard', action: 'Dashboard holding' },
  { prefix: '/commandes', action: 'Vendre' },
  { prefix: '/caisse', action: 'Encaisser' },
  { prefix: '/cuisine', action: 'Cuisine' },
  { prefix: '/stocks', action: 'Stock' },
  { prefix: '/pms', action: 'PMS hôtel' },
  { prefix: '/personnel', action: 'Personnel' },
  { prefix: '/rapports', action: 'Rapports' },
  { prefix: '/livraisons', action: 'Livraisons' },
  { prefix: '/fidelite', action: 'CRM fidélité' },
  { prefix: '/menu-builder', action: 'Catalogue' },
  { prefix: '/factures', action: 'Factures' },
];

const roleAliases: Record<string, string[]> = {
  Admin: ['Admin', 'Direction'],
  Gérant: ['Gérant', 'Manager'],
  Caissier: ['Caissier'],
  Serveur: ['Serveur'],
  'Chef cuisine': ['Chef cuisine'],
  Livreur: ['Livreur'],
  Client: ['Client'],
};

function getRoutePermission(pathname: string, role: string, getPermissionMode: (role: string, action: string) => PermissionMode | undefined) {
  const routeAction = routePermissionActions.find(route => pathname.startsWith(route.prefix))?.action;
  if (!routeAction) return undefined;
  const aliases = roleAliases[role] || [role];
  return aliases
    .map(alias => getPermissionMode(alias, routeAction))
    .find(Boolean);
}

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user } = useAuthStore();
  const { checkIsOffShift } = usePlanningStore();
  const { getPermissionMode } = useHospiStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user tries to access an unauthorized route, redirect to their home
    if (user.role === 'Livreur') return <Navigate to="/livraisons" replace />;
    if (user.role === 'Chef cuisine') return <Navigate to="/cuisine" replace />;
    if (user.role === 'Caissier' || user.role === 'Serveur') return <Navigate to="/caisse" replace />;
    if (user.role === 'Client') return <Navigate to="/client" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const rootAdmin = isDirection(user);
  const routePermission = rootAdmin ? 'allow' : getRoutePermission(location.pathname, user.role, getPermissionMode);
  const scopedAccess = canAccessRoute(user, location.pathname);
  if (!scopedAccess) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
        <div className="glass-card-lg max-w-sm w-full p-6 text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange">Hors périmètre</p>
          <h1 className="text-2xl font-black mt-2">Accès non affecté</h1>
          <p className="text-text-secondary text-sm mt-2">
            Ce profil n’est pas affecté à ce site, cette activité ou ce point de vente.
          </p>
        </div>
      </div>
    );
  }

  if (routePermission === 'deny') {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-6">
        <div className="glass-card-lg max-w-sm w-full p-6 text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-red">Accès bloqué</p>
          <h1 className="text-2xl font-black mt-2">Droit insuffisant</h1>
          <p className="text-text-secondary text-sm mt-2">
            Cette zone est désactivée pour ton profil. Un administrateur peut l’ouvrir depuis Admin Hospi.
          </p>
        </div>
      </div>
    );
  }

  // Shift-based Access Control
  const operationalRoles = ['Serveur', 'Chef cuisine', 'Caissier', 'Livreur'];
  const personalRoutes = ['/personnel', '/plus']; // Routes allowed off-shift

  if (operationalRoles.includes(user.role) && user.employeeId && !user.shiftOverride) {
    const isOffShift = checkIsOffShift(user.employeeId);
    if (isOffShift && !personalRoutes.includes(location.pathname)) {
      // If off shift and trying to access an operational route, redirect to personnel
      return <Navigate to="/personnel" replace />;
    }
  }

  return <>{children}</>;
}
