import { useState } from "react";
import { formatEther } from "ethers";
import { useMyDisputes } from "../hooks/useMyDisputes";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const GATEWAY_URL = import.meta.env.VITE_PINATA_GATEWAY_URL;

function DisputeCard({ dispute, contract, onResolved }) {
  const [status, setStatus] = useState("idle"); // idle | refunding | approving
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleRefundClient() {
    setErrorMessage(null);
    setStatus("refunding");
    try {
      const tx = await contract.refundClient(dispute.id);
      await tx.wait();
      onResolved?.();
    } catch (err) {
      console.error("Refund client failed:", err);
      setErrorMessage(err.reason || err.shortMessage || err.message || "Failed to refund client.");
    } finally {
      setStatus("idle");
    }
  }

  async function handleApproveFreelancer() {
    setErrorMessage(null);
    setStatus("approving");
    try {
      const tx = await contract.approveFreelancer(dispute.id);
      await tx.wait();
      onResolved?.();
    } catch (err) {
      console.error("Approve freelancer failed:", err);
      setErrorMessage(err.reason || err.shortMessage || err.message || "Failed to approve freelancer.");
    } finally {
      setStatus("idle");
    }
  }

  const workUrl = dispute.ipfsWorkFileHash
    ? GATEWAY_URL
      ? `${GATEWAY_URL}/ipfs/${dispute.ipfsWorkFileHash}`
      : `${BACKEND_URL}/fetch/${dispute.ipfsWorkFileHash}`
    : null;

  return (
    <li style={{ border: "1px solid #c33", borderRadius: 8, padding: 12, marginBottom: 8 }}>
      <p>
        <strong>Bounty #{dispute.id}</strong> — {formatEther(dispute.escrowAmount)} ETH in escrow
      </p>
      <p style={{ fontSize: 13, color: "#888" }}>Client: {dispute.client}</p>
      <p style={{ fontSize: 13, color: "#888" }}>Freelancer: {dispute.selectedFreelancer}</p>
      <p style={{ fontSize: 13 }}>
        {dispute.workSubmitted ? (
          workUrl ? (
            <a href={workUrl} target="_blank" rel="noreferrer">
              View submitted work
            </a>
          ) : (
            "Work was submitted"
          )
        ) : (
          "No work was submitted before the dispute was raised"
        )}
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={handleRefundClient} disabled={status !== "idle"}>
          {status === "refunding" ? "Refunding..." : "Refund Client (freelancer -30 rep)"}
        </button>
        <button
          onClick={handleApproveFreelancer}
          disabled={status !== "idle" || !dispute.workSubmitted}
          title={!dispute.workSubmitted ? "Freelancer must submit work before they can be approved" : undefined}
        >
          {status === "approving" ? "Approving..." : "Approve Freelancer (+15 rep)"}
        </button>
      </div>

      {errorMessage && <p style={{ color: "crimson", fontSize: 13 }}>{errorMessage}</p>}
    </li>
  );
}

export function ArbiterDisputeDashboard({ contract }) {
  const { disputes, loading, refetch } = useMyDisputes(contract);

  return (
    <div>
      <h2>Disputes Assigned to You</h2>
      {loading && <p>Loading disputes...</p>}
      {!loading && disputes.length === 0 && <p>No disputes pinned to your dashboard right now.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {disputes.map((d) => (
          <DisputeCard key={d.id} dispute={d} contract={contract} onResolved={refetch} />
        ))}
      </ul>
    </div>
  );
}
