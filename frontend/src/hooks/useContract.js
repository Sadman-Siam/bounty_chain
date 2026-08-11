import { useMemo } from "react";
import { getContract } from "../lib/contract";

export function useContract(signer) {
  return useMemo(() => {
    if (!signer) return null;
    return getContract(signer);
  }, [signer]);
}
