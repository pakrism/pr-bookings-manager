import { Navigate, useLocation } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';
import { canAccessRoute } from '../../utils/accessControl';

export default function RequireAccess({ children, fallback = '/dashboard' }) {
  const { userProfile, showToast } = useAppData();
  const location = useLocation();

  if (!canAccessRoute(location.pathname, userProfile)) {
    showToast?.('You do not have access to that page.', 'error');
    return <Navigate to={fallback} replace />;
  }

  return children;
}
