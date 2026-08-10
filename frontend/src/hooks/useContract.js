import { useMemo } from "react";
import { getContract } from "../lib/contract";

/**
 * Returns a Contract instance bound to the connected wallet's signer,
 * so calls are automatically signed by whichever account is active.
 * Returns null until a signer exists (i.e. before the wallet connects).
 */
export function useContract(signer) {
  return useMemo(() => {
    if (!signer) return null;
    return getContract(signer);
  }, [signer]);
}
