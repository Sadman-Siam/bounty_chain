import { useState, useEffect, useCallback } from "react";
import { BrowserProvider } from "ethers";

const ANVIL_CHAIN_ID = 31337n;

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
      const accounts = await browserProvider.send("eth_requestAccounts", []);
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

  useEffect(() => {
    if (!window.ethereum) return;

    const browserProvider = new BrowserProvider(window.ethereum);

    (async () => {
      try {
        const accounts = await browserProvider.send("eth_accounts", []);
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

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
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
