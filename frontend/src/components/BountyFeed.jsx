import { useMemo, useState } from "react";
import { sortBounties } from "../hooks/useBountyFeed";
import { BountyCard } from "./BountyCard";

export function BountyFeed({ bounties, loading, error, refetch, contract, address, role }) {
  const [sortBy, setSortBy] = useState("newest");

  const sortedBounties = useMemo(() => sortBounties(bounties, sortBy), [bounties, sortBy]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Open Bounties</h2>
        <button onClick={refetch} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <label>
        Sort by:{" "}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="budget_desc">Highest Budget</option>
          <option value="budget_asc">Lowest Budget</option>
        </select>
      </label>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!loading && sortedBounties.length === 0 && <p>No open bounties right now.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {sortedBounties.map((b) => (
          <BountyCard
            key={b.id}
            bounty={b}
            contract={contract}
            address={address}
            role={role}
            onBountyLocked={refetch}
          />
        ))}
      </ul>
    </div>
  );
}
