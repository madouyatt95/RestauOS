import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user } = useAuthStore();

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

  return <>{children}</>;
}
