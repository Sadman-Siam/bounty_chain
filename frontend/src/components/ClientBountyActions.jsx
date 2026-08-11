import { useState } from "react";
import { useSoleArbiter } from "../hooks/useSoleArbiter";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const GATEWAY_URL = import.meta.env.VITE_PINATA_GATEWAY_URL;

export function ClientBountyActions({ contract, bounty, onActionComplete }) {
  const { arbiter, loading: loadingArbiter } = useSoleArbiter(contract);
  const [status, setStatus] = useState("idle"); // idle | approving | disputing
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleApprove() {
    setErrorMessage(null);
    setStatus("approving");
    try {
      const tx = await contract.approveWork(bounty.id);
      await tx.wait();
      onActionComplete?.();
    } catch (err) {
      console.error("Approve work failed:", err);
      setErrorMessage(
        err.reason ||
          err.shortMessage ||
          err.message ||
          "Failed to approve work.",
      );
    } finally {
      setStatus("idle");
    }
  }

  async function handleDispute() {
    if (!arbiter) {
      setErrorMessage(
        "No arbiter is registered on the platform yet — a dispute can't be raised.",
      );
      return;
    }
    setErrorMessage(null);
    setStatus("disputing");
    try {
      const tx = await contract.disputeWork(bounty.id, arbiter);
      await tx.wait();
      onActionComplete?.();
    } catch (err) {
      console.error("Dispute failed:", err);
      setErrorMessage(
        err.reason ||
          err.shortMessage ||
          err.message ||
          "Failed to raise dispute.",
      );
    } finally {
      setStatus("idle");
    }
  }

  if (!bounty.workSubmitted) {
    return (
      <p style={{ fontSize: 13, color: "#888" }}>
        Waiting for the freelancer to submit work.
      </p>
    );
  }

  const workUrl = GATEWAY_URL
    ? `${GATEWAY_URL}/ipfs/${bounty.ipfsWorkFileHash}`
    : `${BACKEND_URL}/fetch/${bounty.ipfsWorkFileHash}`;

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 13 }}>
        Work submitted —{" "}
        <a href={workUrl} target="_blank" rel="noreferrer">
          view submission
        </a>
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleApprove} disabled={status !== "idle"}>
          {status === "approving" ? "Approving..." : "Approve Work"}
        </button>
        <button
          onClick={handleDispute}
          disabled={status !== "idle" || loadingArbiter}
          style={{ color: "crimson" }}
        >
          {status === "disputing" ? "Raising dispute..." : "Raise Dispute"}
        </button>
      </div>

      {errorMessage && (
        <p style={{ color: "crimson", fontSize: 13 }}>{errorMessage}</p>
      )}
    </div>
  );
}
