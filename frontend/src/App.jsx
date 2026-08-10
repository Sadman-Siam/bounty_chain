import { useEffect, useState, useCallback } from "react";
import { useWallet } from "./hooks/useWallet";
import { useContract } from "./hooks/useContract";
import { useBountyFeed } from "./hooks/useBountyFeed";
import { useContractEvents } from "./hooks/useContractEvents";
import { RegisterForm } from "./components/RegisterForm";
import { PostBountyForm } from "./components/PostBountyForm";
import { BountyFeed } from "./components/BountyFeed";
import { MyBountiesSection } from "./components/MyBountiesSection";
import { ArbiterDisputeDashboard } from "./components/ArbiterDisputeDashboard";
import { ClaimFundsCard } from "./components/ClaimFundsCard";
import "./App.css";

// Mirrors the contract's enum Role { Arbiter, client, Freelancer }
const ROLE_LABELS = ["Arbiter", "Client", "Freelancer"];

function App() {
  const { address, signer, chainId, isConnecting, isWrongNetwork, error, connect, isConnected } =
    useWallet();
  const contract = useContract(signer);

  // Bumped by useContractEvents whenever any relevant contract event fires,
  // so every data-fetching hook below re-reads fresh state from the chain —
  // this is what makes the UI update live across browser windows (spec 3.5).
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const bumpRefreshTrigger = useCallback(() => setRefreshTrigger((t) => t + 1), []);
  useContractEvents(contract, bumpRefreshTrigger);

  const { bounties, loading: loadingBounties, error: bountiesError, refetch: refetchBounties } =
    useBountyFeed(contract, refreshTrigger);

  const [userInfo, setUserInfo] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);

  // Whenever the connected address or contract instance changes, re-read
  // the on-chain registry so the dashboard reflects the current wallet.
  const fetchUser = useCallback(() => {
    if (!contract || !address) {
      setUserInfo(null);
      return;
    }

    setLoadingUser(true);
    contract
      .getUser(address)
      .then((result) => {
        setUserInfo({
          name: result.name,
          role: Number(result.role),
          reputation: result.reputation, // signed int per the contract's `int reputation`
          isRegistered: result.isRegistered,
        });
      })
      .catch((err) => {
        console.error("Failed to read user from contract:", err);
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, [contract, address, refreshTrigger]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>BountyPulse</h1>

      {!isConnected && (
        <button onClick={connect} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {isConnected && (
        <div>
          <p>
            <strong>Connected:</strong> {address}
          </p>

          {isWrongNetwork && (
            <p style={{ color: "crimson" }}>
              Wrong network — please switch MetaMask to the local Anvil chain (Chain ID 31337).
            </p>
          )}

          {loadingUser && <p>Loading registry info...</p>}

          {!loadingUser && userInfo && (
            <div>
              {userInfo.isRegistered ? (
                <>
                  <p>
                    <strong>Name:</strong> {userInfo.name}
                  </p>
                  <p>
                    <strong>Role:</strong> {ROLE_LABELS[userInfo.role]}
                  </p>
                  <p>
                    <strong>Reputation:</strong> {userInfo.reputation.toString()}
                  </p>

                  <ClaimFundsCard contract={contract} address={address} refreshTrigger={refreshTrigger} />

                  {/* Only Client accounts (role === 1) can post a bounty */}
                  {userInfo.role === 1 && (
                    <PostBountyForm contract={contract} onPosted={refetchBounties} />
                  )}

                  <hr style={{ margin: "24px 0" }} />

                  <MyBountiesSection contract={contract} address={address} refreshTrigger={refreshTrigger} />

                  {/* Arbiter accounts (role === 0) get a dedicated dispute queue */}
                  {userInfo.role === 0 && (
                    <>
                      <hr style={{ margin: "24px 0" }} />
                      <ArbiterDisputeDashboard contract={contract} refreshTrigger={refreshTrigger} />
                    </>
                  )}

                  <hr style={{ margin: "24px 0" }} />

                  <BountyFeed
                    bounties={bounties}
                    loading={loadingBounties}
                    error={bountiesError}
                    refetch={refetchBounties}
                    contract={contract}
                    address={address}
                    role={userInfo.role}
                  />
                </>
              ) : (
                <RegisterForm contract={contract} onRegistered={fetchUser} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
