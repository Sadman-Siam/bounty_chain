import { useState } from "react";
import { parseEther } from "ethers";

/**
 * createBid is deliberately non-payable per the spec — freelancers only
 * propose a price, they don't send ETH at bid time. Escrow funding happens
 * later, when the client calls selectBid.
 */
export function BidForm({ contract, bountyId, onBidPlaced }) {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("idle"); // idle | confirming | error
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage(null);

    if (!amount || Number(amount) <= 0) {
      setErrorMessage("Enter a valid bid amount.");
      return;
    }

    let amountWei;
    try {
      amountWei = parseEther(amount);
    } catch {
      setErrorMessage("Invalid bid amount.");
      return;
    }

    try {
      setStatus("confirming");
      const tx = await contract.createBid(bountyId, amountWei);
      await tx.wait();
      setStatus("idle");
      setAmount("");
      onBidPlaced?.();
    } catch (err) {
      console.error("Bid failed:", err);
      // ethers surfaces the contract's revert reason on err.reason (or err.shortMessage)
      setErrorMessage(err.reason || err.shortMessage || err.message || "Failed to place bid.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
      <input
        type="number"
        step="0.0001"
        min="0"
        placeholder="Your bid (ETH)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={status === "confirming"}
        style={{ flex: 1 }}
      />
      <button type="submit" disabled={status === "confirming"}>
        {status === "confirming" ? "Placing bid..." : "Place Bid"}
      </button>
      {errorMessage && <span style={{ color: "crimson", fontSize: 13 }}>{errorMessage}</span>}
    </form>
  );
}
