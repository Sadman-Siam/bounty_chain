import { useEffect, useState } from "react";
import { formatEther } from "ethers";
import { useBids } from "../hooks/useBids";
import { BidForm } from "./BidForm";
import { BidList } from "./BidList";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const CLIENT_ROLE = 1;
const FREELANCER_ROLE = 2;

export function BountyCard({
  bounty,
  contract,
  address,
  role,
  onBountyLocked,
}) {
  const {
    bids,
    loading: loadingBids,
    refetch: refetchBids,
  } = useBids(contract, bounty.id);
  const [description, setDescription] = useState(null);

  const isOwner =
    !!address && bounty.client.toLowerCase() === address.toLowerCase();
  const isFreelancer = role === FREELANCER_ROLE;

  useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND_URL}/fetch/${bounty.ipfsBountyDetailsHash}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled)
          setDescription(data.description ?? JSON.stringify(data));
      })
      .catch((err) => {
        console.error("Failed to load bounty description:", err);
        if (!cancelled) setDescription("(failed to load description)");
      });
    return () => {
      cancelled = true;
    };
  }, [bounty.ipfsBountyDetailsHash]);

  function handleBidSelected() {
    refetchBids();
    onBountyLocked?.();
  }

  return (
    <li
      style={{
        border: "1px solid #444",
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <p>
        <strong>Bounty #{bounty.id}</strong> — {formatEther(bounty.maxBudget)}{" "}
        ETH max budget
      </p>
      <p style={{ fontSize: 13, color: "#888" }}>Client: {bounty.client}</p>
      <p style={{ fontSize: 13 }}>{description ?? "Loading description..."}</p>

      {loadingBids ? (
        <p style={{ fontSize: 13 }}>Loading bids...</p>
      ) : (
        <BidList
          bids={bids}
          isOwner={isOwner}
          contract={contract}
          bountyId={bounty.id}
          onBidSelected={handleBidSelected}
        />
      )}

      {/*  freelancer */}
      {isFreelancer && !isOwner && (
        <BidForm
          contract={contract}
          bountyId={bounty.id}
          onBidPlaced={refetchBids}
        />
      )}
    </li>
  );
}
