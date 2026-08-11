import { formatEther, parseEther } from "ethers";
import { useState } from "react";

function shortAddress(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function BidList({ bids, isOwner, contract, bountyId, onBidSelected }) {
  const [selectingIndex, setSelectingIndex] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  // Keyed by bid index so each bid row has its own independent, editable amount.
  const [amounts, setAmounts] = useState({});

  function amountFor(bid) {
    return amounts[bid.index] ?? formatEther(bid.amount);
  }

  async function handleSelect(bid) {
    setErrorMessage(null);
    setInfoMessage(null);
    setSelectingIndex(bid.index);

    let valueWei;
    try {
      valueWei = parseEther(amountFor(bid));
    } catch {
      setErrorMessage("Invalid ETH amount.");
      setSelectingIndex(null);
      return;
    }

    try {
      const tx = await contract.selectBid(bountyId, bid.index, {
        value: valueWei,
      });
      await tx.wait();

      if (valueWei > bid.amount) {
        const credited = valueWei - bid.amount;
        setInfoMessage(
          `Sent ${formatEther(valueWei)} ETH — contract locked the exact bid (${formatEther(
            bid.amount,
          )} ETH) and credited the ${formatEther(
            credited,
          )} ETH excess to your Claim Funds balance above (not sent back to your wallet automatically — click Claim Funds to withdraw it).`,
        );
      }

      onBidSelected?.();
    } catch (err) {
      console.error("Select bid failed:", err);

      setErrorMessage(
        err.reason ||
          err.shortMessage ||
          err.message ||
          "Failed to select bid.",
      );
    } finally {
      setSelectingIndex(null);
    }
  }

  if (bids.length === 0) {
    return <p style={{ fontSize: 13, color: "#888" }}>No bids yet.</p>;
  }

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4 }}>
        Bids ({bids.length})
      </p>
      {errorMessage && (
        <p style={{ color: "crimson", fontSize: 13 }}>{errorMessage}</p>
      )}
      {infoMessage && (
        <p style={{ color: "seagreen", fontSize: 13 }}>{infoMessage}</p>
      )}
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
              gap: 8,
            }}
          >
            <span>
              {shortAddress(b.freelancer)} — bid: {formatEther(b.amount)} ETH
            </span>

            {isOwner && (
              <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={amountFor(b)}
                  onChange={(e) =>
                    setAmounts((prev) => ({
                      ...prev,
                      [b.index]: e.target.value,
                    }))
                  }
                  disabled={selectingIndex !== null}
                  style={{ width: 100 }}
                  title="ETH to send to escrow — defaults to the exact bid, but you can change it to see the contract's revert/pull-payment logic"
                />
                <button
                  onClick={() => handleSelect(b)}
                  disabled={selectingIndex !== null}
                >
                  {selectingIndex === b.index ? "Selecting..." : "Select"}
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
