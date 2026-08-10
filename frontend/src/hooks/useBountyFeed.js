import { useCallback, useEffect, useState } from "react";

// Mirrors `enum BountyStatus { Open, Locked, Disputed, Resolved }`
const BOUNTY_STATUS = ["Open", "Locked", "Disputed", "Resolved"];
const OPEN_STATUS_VALUE = 0;

/**
 * Fetches every bounty from the contract and filters to only "Open" ones.
 *
 * IMPORTANT (gas-optimization talking point for the viva):
 * Sorting happens entirely client-side, in plain JavaScript, AFTER the data
 * is read from the chain. `bounties(i)` and `bountyCount()` are `view`
 * functions — reading them costs no gas at all, so fetching every bounty
 * and sorting in JS is free. Writing a sort loop *inside* the Solidity
 * contract would be the wrong move: every call that touches storage in a
 * loop costs gas proportional to the number of iterations, and a sort
 * exposed as a public/external function would let anyone burn arbitrary
 * gas (or hit the block gas limit entirely) as the bounty list grows.
 * The rule of thumb: read raw data cheaply off-chain, do all filtering/
 * sorting/searching in the frontend, and reserve on-chain logic for the
 * state changes that actually need consensus.
 */
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

      // Fetch every bounty in parallel rather than sequentially awaiting
      // each one — same number of RPC calls either way, but this doesn't
      // block on round-trip latency per bounty.
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
        })
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

/**
 * Pure client-side sort — takes the already-fetched array and returns a
 * new sorted array. No contract calls, no gas, just Array.sort in JS.
 */
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
