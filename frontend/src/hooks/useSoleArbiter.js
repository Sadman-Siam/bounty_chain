import { useEffect, useState } from "react";

/**
 * Single-arbiter model: setUser rejects a second Arbiter registration, so
 * getArbiters() will only ever return zero or one address. This hook just
 * grabs that one address (or null if nobody's registered as arbiter yet).
 */
export function useSoleArbiter(contract) {
  const [arbiter, setArbiter] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contract) {
      setArbiter(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    contract
      .getArbiters()
      .then((list) => {
        if (!cancelled) setArbiter(list.length > 0 ? list[0] : null);
      })
      .catch((err) => {
        console.error("Failed to fetch arbiter:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contract]);

  return { arbiter, loading };
}
