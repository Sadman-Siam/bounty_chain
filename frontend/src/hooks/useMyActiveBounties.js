import { useCallback, useEffect, useState } from "react";

// Mirrors `enum BountyStatus { Open, Locked, Disputed, Resolved }`
const LOCKED = 1;
const DISPUTED = 2;

/**
 * Fetches every bounty and filters down to the ones the current wallet is
 * actively involved in (as the client who posted it, or the freelancer
 * selected to do the work), restricted to Locked/Disputed status — i.e.
 * "things that still need action from me." Open bounties belong in the
 * main feed; Resolved ones are done and don't need a dashboard entry.
 */
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
        })
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
