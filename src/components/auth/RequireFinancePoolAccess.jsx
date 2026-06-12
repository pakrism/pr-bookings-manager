import { Navigate, useLocation } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';
import { canAccessFinanceRoute, getManagerPoolId } from '../../utils/accessControl';

export default function RequireFinancePoolAccess({ poolId, children }) {
  const { userProfile, showToast } = useAppData();
  const location = useLocation();

  if (!canAccessFinanceRoute(location.pathname, userProfile)) {
    showToast?.('You do not have access to that page.', 'error');
    const fallbackPool = getManagerPoolId(userProfile);
    const fallback = fallbackPool ? `/finance/${fallbackPool}` : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  if (poolId && !canAccessFinanceRoute(`/finance/${poolId}`, userProfile)) {
    showToast?.('You do not have access to that pool.', 'error');
    const fallbackPool = getManagerPoolId(userProfile);
    return <Navigate to={fallbackPool ? `/finance/${fallbackPool}` : '/dashboard'} replace />;
  }

  return children;
}
