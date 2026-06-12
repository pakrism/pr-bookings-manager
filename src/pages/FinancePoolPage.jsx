import FinancePoolView from '../components/revenue/FinancePoolView';
import RequireFinancePoolAccess from '../components/auth/RequireFinancePoolAccess';
import { useFinanceContext } from '../context/FinanceDataContext';

export default function FinancePoolPage({ poolId }) {
  const ctx = useFinanceContext();

  return (
    <RequireFinancePoolAccess poolId={poolId}>
      <FinancePoolView poolId={poolId} {...ctx} />
    </RequireFinancePoolAccess>
  );
}
