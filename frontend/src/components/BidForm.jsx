import { useState } from "react";
import { parseEther } from "ethers";

export function BidForm({ contract, bountyId, onBidPlaced }) {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("idle");
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
      setErrorMessage(
        err.reason || err.shortMessage || err.message || "Failed to place bid.",
      );
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}
    >
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
      {errorMessage && (
        <span style={{ color: "crimson", fontSize: 13 }}>{errorMessage}</span>
      )}
    </form>
  );
}
