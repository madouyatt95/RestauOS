import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePlanningStore } from '../stores/planningStore';

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user } = useAuthStore();
  const { checkIsOffShift } = usePlanningStore();
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
