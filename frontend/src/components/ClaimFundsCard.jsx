import { useState } from "react";
import { formatEther } from "ethers";
import { useWithdrawableBalance } from "../hooks/useWithdrawableBalance";

/**
 * Pull-payment claim UI (spec 3.4). Freelancers accumulate their 98% payout
 * here after approveWork/approveFreelancer; Arbiters accumulate their 2%
 * fee here; Clients can also land here if refundClient paid them out after
 * a dispute. Shown to everyone rather than gated by role, since a client
 * refund is a legitimate way to end up with a nonzero balance too.
 */
export function ClaimFundsCard({ contract, address }) {
  const { balance, loading, refetch } = useWithdrawableBalance(contract, address);
  const [claiming, setClaiming] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleClaim() {
    setErrorMessage(null);
    setClaiming(true);
    try {
      const tx = await contract.withdraw();
      await tx.wait();
      await refetch();
    } catch (err) {
      console.error("Claim failed:", err);
      setErrorMessage(err.reason || err.shortMessage || err.message || "Failed to claim funds.");
    } finally {
      setClaiming(false);
    }
  }

  const hasBalance = balance > 0n;

  return (
    <div style={{ border: "1px solid #444", borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: "#888" }}>Unclaimed Earnings</p>
      <p style={{ margin: "4px 0", fontSize: 20, fontWeight: "bold" }}>
        {loading ? "..." : `${formatEther(balance)} ETH`}
      </p>

      <button onClick={handleClaim} disabled={!hasBalance || claiming || loading}>
        {claiming ? "Claiming..." : "Claim Funds"}
      </button>

      {errorMessage && <p style={{ color: "crimson", fontSize: 13 }}>{errorMessage}</p>}
    </div>
  );
}
