import { useState } from "react";
import { parseEther } from "ethers";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export function PostBountyForm({ contract, onPosted }) {
  const [description, setDescription] = useState("");
  const [budgetEth, setBudgetEth] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState(null);

  const isSubmitting = status === "pinning" || status === "confirming";

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage(null);

    if (!description.trim()) {
      setErrorMessage("Description is required.");
      return;
    }
    if (!budgetEth || Number(budgetEth) <= 0) {
      setErrorMessage("Max budget must be greater than zero.");
      return;
    }
    if (!contract) {
      setErrorMessage("Wallet not connected.");
      return;
    }

    let budgetWei;
    try {
      budgetWei = parseEther(budgetEth);
    } catch {
      setErrorMessage("Invalid budget amount.");
      return;
    }

    try {
      setStatus("pinning");
      const res = await fetch(`${BACKEND_URL}/upload/json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to pin bounty details");
      }

      const { cid } = await res.json();

      setStatus("confirming");
      const tx = await contract.createBounty(cid, budgetWei);
      await tx.wait();

      setStatus("idle");
      setDescription("");
      setBudgetEth("");
      onPosted?.();
    } catch (err) {
      console.error("Failed to post bounty:", err);
      setErrorMessage(
        err.message || "Failed to post bounty. Please try again.",
      );
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <h2>Post a Bounty</h2>

      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={4}
          placeholder="What needs to get done?"
        />
      </label>

      <label>
        Max Budget (ETH)
        <input
          type="number"
          step="0.0001"
          min="0"
          value={budgetEth}
          onChange={(e) => setBudgetEth(e.target.value)}
          disabled={isSubmitting}
          placeholder="0.5"
        />
      </label>

      {errorMessage && <p style={{ color: "crimson" }}>{errorMessage}</p>}

      <button type="submit" disabled={isSubmitting}>
        {status === "pinning" && "Pinning details..."}
        {status === "confirming" && "Confirming transaction..."}
        {(status === "idle" || status === "error") && "Post Bounty"}
      </button>
    </form>
  );
}
