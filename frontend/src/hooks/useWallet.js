import { useState, useEffect, useCallback } from "react";
import { BrowserProvider } from "ethers";

// Anvil's default local chain ID, per the spec (Checkpoint 1 requirement).
const ANVIL_CHAIN_ID = 31337n; // ethers v6 returns chainId as a BigInt

/**
 * Handles MetaMask connection state for the whole app:
 * - Auto-detects an already-authorized account on page load (no popup, no text input)
 * - Exposes `connect()` for an explicit "Connect Wallet" button when nothing is auto-detected
 * - Listens for `accountsChanged` so switching accounts in MetaMask updates the UI instantly
 * - Flags `isWrongNetwork` if MetaMask isn't pointed at the local Anvil chain
 */
export function useWallet() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install the MetaMask extension.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []); // prompts MetaMask popup
      const network = await browserProvider.getNetwork();
      const currentSigner = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(currentSigner);
      setAddress(accounts[0]);
      setChainId(network.chainId);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // On mount: check for an already-authorized account without prompting a popup.
  // This is the spec's "auto-detect the active MetaMask address on load" requirement.
  useEffect(() => {
    if (!window.ethereum) return;

    const browserProvider = new BrowserProvider(window.ethereum);

    (async () => {
      try {
        const accounts = await browserProvider.send("eth_accounts", []); // silent — no popup
        if (accounts.length > 0) {
          const network = await browserProvider.getNetwork();
          const currentSigner = await browserProvider.getSigner();
          setProvider(browserProvider);
          setSigner(currentSigner);
          setAddress(accounts[0]);
          setChainId(network.chainId);
        }
      } catch (err) {
        console.error("Auto-detect wallet failed:", err);
      }
    })();
  }, []);

  // React instantly when the user switches accounts or networks in MetaMask.
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User locked MetaMask or revoked access.
        setAddress(null);
        setSigner(null);
      } else {
        setAddress(accounts[0]);
        const browserProvider = new BrowserProvider(window.ethereum);
        setProvider(browserProvider);
        browserProvider.getSigner().then(setSigner);
      }
    };

    const handleChainChanged = () => {
      // Reloading is the approach MetaMask's own docs recommend here —
      // provider/signer/contract instances can end up stale otherwise.
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const isWrongNetwork = chainId !== null && chainId !== ANVIL_CHAIN_ID;

  return {
    address,
    provider,
    signer,
    chainId,
    isConnecting,
    isWrongNetwork,
    error,
    connect,
    isConnected: !!address,
  };
}
