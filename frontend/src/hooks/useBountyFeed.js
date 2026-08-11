import { useCallback, useEffect, useState } from "react";

const BOUNTY_STATUS = ["Open", "Locked", "Disputed", "Resolved"];
const OPEN_STATUS_VALUE = 0;

export function useBountyFeed(contract, refreshTrigger) {
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBounties = useCallback(async () => {
    if (!contract) {
      setBounties([]);
      return;
    }

    setLoading(true);
    setError(null);

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
            maxBudget: b.maxBudget, // BigInt, in Wei
            client: b.client,
            status: Number(b.status),
            statusLabel: BOUNTY_STATUS[Number(b.status)],
            selectedFreelancer: b.selectedFreelancer,
            bidAmount: b.bidAmount,
            escrowAmount: b.escrowAmount,
          };
        }),
      );

      const openOnly = results.filter((b) => b.status === OPEN_STATUS_VALUE);
      setBounties(openOnly);
    } catch (err) {
      console.error("Failed to fetch bounties:", err);
      setError(err.message || "Failed to load bounties");
    } finally {
      setLoading(false);
    }
  }, [contract, refreshTrigger]);

  useEffect(() => {
    fetchBounties();
  }, [fetchBounties]);

  return { bounties, loading, error, refetch: fetchBounties };
}

export function sortBounties(bounties, sortBy) {
  const sorted = [...bounties];
  switch (sortBy) {
    case "budget_desc":
      return sorted.sort((a, b) => (b.maxBudget > a.maxBudget ? 1 : -1));
    case "budget_asc":
      return sorted.sort((a, b) => (a.maxBudget > b.maxBudget ? 1 : -1));
    case "newest":
      return sorted.sort((a, b) => b.id - a.id);
    case "oldest":
    default:
      return sorted.sort((a, b) => a.id - b.id);
  }
}
