import { useCallback, useEffect, useState } from "react";

const LOCKED = 1;
const DISPUTED = 2;

export function useMyActiveBounties(contract, address, refreshTrigger) {
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyBounties = useCallback(async () => {
    if (!contract || !address) {
      setBounties([]);
      return;
    }

    setLoading(true);
    try {
      const count = await contract.bountyCount();
      const total = Number(count);
      const indices = Array.from({ length: total }, (_, i) => i);

      const results = await Promise.all(
        indices.map(async (i) => {
          const b = await contract.bounties(i);
          return {
            id: i,
            ipfsBountyDetailsHash: b.ipfsBountyDetailsHash,
            maxBudget: b.maxBudget,
            client: b.client,
            status: Number(b.status),
            selectedFreelancer: b.selectedFreelancer,
            bidAmount: b.bidAmount,
            escrowAmount: b.escrowAmount,
            ipfsWorkFileHash: b.ipfsWorkFileHash,
            workSubmitted: b.workSubmitted,
            assignedArbiter: b.assignedArbiter,
          };
        }),
      );

      const lowerAddress = address.toLowerCase();
      const mine = results.filter((b) => {
        const isActiveStatus = b.status === LOCKED || b.status === DISPUTED;
        const isMine =
          b.client.toLowerCase() === lowerAddress ||
          b.selectedFreelancer.toLowerCase() === lowerAddress;
        return isActiveStatus && isMine;
      });

      setBounties(mine);
    } catch (err) {
      console.error("Failed to fetch active bounties:", err);
    } finally {
      setLoading(false);
    }
  }, [contract, address, refreshTrigger]);

  useEffect(() => {
    fetchMyBounties();
  }, [fetchMyBounties]);

  return { bounties, loading, refetch: fetchMyBounties };
}
