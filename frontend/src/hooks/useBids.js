import { useCallback, useEffect, useState } from "react";

/**
 * `bids` is a public `mapping(uint => bid[])` in the contract, which only
 * gives us an indexed single-element getter (`bids(bountyId, i)`) — there's
 * no `getBidCount` view function, so we can't just loop until we run out.
 *
 * Instead we reconstruct the bid list from `BidPlaced` event logs, filtered
 * by the indexed `bountyId`. This is free (no gas, just an RPC log query)
 * and reliable: `bids[_bountyId].push(...)` is append-only — nothing ever
 * removes a bid — so the order events were emitted in is guaranteed to
 * match the on-chain array order. `queryFilter` returns logs in ascending
 * block/log order, so the position of each event in the returned array
 * *is* the correct `_bidIndex` to pass into `selectBid`.
 */
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
        index: i, // matches bids[bountyId][i] on-chain, see note above
        freelancer: event.args.freelancer,
        amount: event.args.amount, // BigInt, in Wei
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
