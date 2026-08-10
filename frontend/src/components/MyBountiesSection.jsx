import { formatEther } from "ethers";
import { useMyActiveBounties } from "../hooks/useMyActiveBounties";
import { SubmitWorkForm } from "./SubmitWorkForm";
import { ClientBountyActions } from "./ClientBountyActions";

const STATUS_LABELS = ["Open", "Locked", "Disputed", "Resolved"];

function MyBountyCard({ bounty, contract, address, onChanged }) {
  const isClient = bounty.client.toLowerCase() === address.toLowerCase();
  const isFreelancer = bounty.selectedFreelancer.toLowerCase() === address.toLowerCase();

  return (
    <li style={{ border: "1px solid #444", borderRadius: 8, padding: 12, marginBottom: 8 }}>
      <p>
        <strong>Bounty #{bounty.id}</strong> — {formatEther(bounty.escrowAmount)} ETH in escrow —{" "}
        <em>{STATUS_LABELS[bounty.status]}</em>
      </p>

      {bounty.status === 2 && (
        <p style={{ fontSize: 13, color: "crimson" }}>
          This bounty is under dispute — the assigned arbiter will resolve it.
        </p>
      )}

      {bounty.status === 1 && isClient && (
        <ClientBountyActions contract={contract} bounty={bounty} onActionComplete={onChanged} />
      )}

      {bounty.status === 1 && isFreelancer && !bounty.workSubmitted && (
        <SubmitWorkForm contract={contract} bountyId={bounty.id} onSubmitted={onChanged} />
      )}

      {bounty.status === 1 && isFreelancer && bounty.workSubmitted && (
        <p style={{ fontSize: 13, color: "#888" }}>Work submitted — waiting for client review.</p>
      )}
    </li>
  );
}

export function MyBountiesSection({ contract, address }) {
  const { bounties, loading, refetch } = useMyActiveBounties(contract, address);

  if (!loading && bounties.length === 0) return null; // nothing active — don't clutter the dashboard

  return (
    <div>
      <h2>My Active Bounties</h2>
      {loading && <p>Loading...</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {bounties.map((b) => (
          <MyBountyCard key={b.id} bounty={b} contract={contract} address={address} onChanged={refetch} />
        ))}
      </ul>
    </div>
  );
}
