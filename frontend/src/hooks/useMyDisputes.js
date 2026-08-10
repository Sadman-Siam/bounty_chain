import { useCallback, useEffect, useState } from "react";

/**
 * Calls the contract's own getMyDisputes() — it already filters to bounties
 * where assignedArbiter == msg.sender && status == Disputed, so this is
 * exactly the "pinned to my dashboard" queue with no extra filtering needed
 * on the frontend.
 */
export function useMyDisputes(contract, refreshTrigger) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDisputes = useCallback(async () => {
    if (!contract) {
      setDisputes([]);
      return;
    }

    setLoading(true);
    try {
      const ids = await contract.getMyDisputes();
      const details = await Promise.all(
        ids.map(async (idBigInt) => {
          const id = Number(idBigInt);
          const b = await contract.bounties(id);
          return {
            id,
            ipfsBountyDetailsHash: b.ipfsBountyDetailsHash,
            client: b.client,
            selectedFreelancer: b.selectedFreelancer,
            escrowAmount: b.escrowAmount,
            ipfsWorkFileHash: b.ipfsWorkFileHash,
            workSubmitted: b.workSubmitted,
          };
        })
      );
      setDisputes(details);
    } catch (err) {
      console.error("Failed to fetch disputes:", err);
    } finally {
      setLoading(false);
    }
  }, [contract, refreshTrigger]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  return { disputes, loading, refetch: fetchDisputes };
}
