import { formatEther } from "ethers";
import { useState } from "react";

function shortAddress(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Pure display + selection component. Bid data is fetched by the parent
 * (BountyCard, via useBids) so it can share the same bids array with
 * BidForm's refetch trigger without duplicating fetch logic.
 */
export function BidList({ bids, isOwner, contract, bountyId, onBidSelected }) {
  const [selectingIndex, setSelectingIndex] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleSelect(bidIndex, bidAmountWei) {
    setErrorMessage(null);
    setSelectingIndex(bidIndex);
    try {
      // Send exactly the bid amount as escrow — the contract also accepts
      // overpayment and refunds the difference, but there's no reason to
      // rely on that path from the frontend when we already know the exact figure.
      const tx = await contract.selectBid(bountyId, bidIndex, { value: bidAmountWei });
      await tx.wait();
      onBidSelected?.();
    } catch (err) {
      console.error("Select bid failed:", err);
      setErrorMessage(err.reason || err.shortMessage || err.message || "Failed to select bid.");
    } finally {
      setSelectingIndex(null);
    }
  }

  if (bids.length === 0) {
    return <p style={{ fontSize: 13, color: "#888" }}>No bids yet.</p>;
  }

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4 }}>Bids ({bids.length})</p>
      {errorMessage && <p style={{ color: "crimson", fontSize: 13 }}>{errorMessage}</p>}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {bids.map((b) => (
          <li
            key={b.index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 0",
              fontSize: 13,
            }}
          >
            <span>
              {shortAddress(b.freelancer)} — {formatEther(b.amount)} ETH
            </span>
            {isOwner && (
              <button onClick={() => handleSelect(b.index, b.amount)} disabled={selectingIndex !== null}>
                {selectingIndex === b.index ? "Selecting..." : "Select"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
