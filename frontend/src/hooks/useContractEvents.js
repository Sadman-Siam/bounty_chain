import { useEffect } from "react";

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
