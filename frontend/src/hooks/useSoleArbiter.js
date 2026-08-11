import { useEffect, useState } from "react";

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
