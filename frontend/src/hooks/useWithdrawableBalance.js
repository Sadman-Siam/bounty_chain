import { useCallback, useEffect, useState } from "react";

export function useWithdrawableBalance(contract, address, refreshTrigger) {
  const [balance, setBalance] = useState(0n);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!contract || !address) {
      setBalance(0n);
      return;
    }
    setLoading(true);
    try {
      const result = await contract.withdrawableBalance(address);
      setBalance(result);
    } catch (err) {
      console.error("Failed to fetch withdrawable balance:", err);
    } finally {
      setLoading(false);
    }
  }, [contract, address, refreshTrigger]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
}
