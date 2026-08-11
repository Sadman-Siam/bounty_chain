import { useCallback, useEffect, useState } from "react";

export function useBids(contract, bountyId) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBids = useCallback(async () => {
    if (!contract || bountyId === undefined || bountyId === null) return;

    setLoading(true);
    try {
      const filter = contract.filters.BidPlaced(bountyId);
      const events = await contract.queryFilter(filter);

      const parsed = events.map((event, i) => ({
        index: i,
        freelancer: event.args.freelancer,
        amount: event.args.amount,
      }));

      setBids(parsed);
    } catch (err) {
      console.error("Failed to fetch bids:", err);
    } finally {
      setLoading(false);
    }
  }, [contract, bountyId]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  return { bids, loading, refetch: fetchBids };
}
