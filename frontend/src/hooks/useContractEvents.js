import { useEffect } from "react";

/**
 * Subscribes to every state-changing contract event (spec 3.5: "the UI must
 * update reactively using Ethers.js event listeners... without requiring a
 * hard page reload"). Rather than tracking exactly which piece of state
 * each event affects, this takes the simpler, more robust approach: ANY
 * relevant event bumps a shared "refresh tick," and every data-fetching
 * hook in the app (useBountyFeed, useMyActiveBounties, useMyDisputes,
 * useWithdrawableBalance, fetchUser) re-reads from the chain when that tick
 * changes. Slightly more RPC calls than a fully granular approach, but far
 * less fragile — a Client approving work in one browser window correctly
 * updates a Freelancer's Unclaimed Earnings in another window, since the
 * WorkApproved event bumps the tick and every subscribed component re-fetches
 * its own slice of state fresh from the chain.
 */
export function useContractEvents(contract, onChange) {
  useEffect(() => {
    if (!contract || !onChange) return;

    const EVENT_NAMES = [
      "UserRegistered",
      "BountyCreated",
      "BidPlaced",
      "BidSelected",
      "WorkSubmitted",
      "WorkApproved",
      "DisputeRaised",
      "DisputeResolved",
      "Withdrawal",
    ];

    const handler = () => onChange();

    EVENT_NAMES.forEach((name) => contract.on(name, handler));

    return () => {
      EVENT_NAMES.forEach((name) => contract.off(name, handler));
    };
  }, [contract, onChange]);
}
