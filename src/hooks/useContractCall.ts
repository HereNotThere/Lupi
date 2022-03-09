import { DependencyList, useEffect, useState } from "react";

export const useContractCall = <T>(
  func?: () => Promise<T> | undefined,
  deps?: DependencyList
) => {
  const [state, setState] = useState<T | undefined>(undefined);

  useEffect(() => {
    let shutdown = false;
    void (async () => {
      try {
        if (func) {
          const round = await func();
          if (!shutdown) {
            setState(round);
          }
        }
      } catch (err) {
        console.warn(`useContractCall failed`, err);
        setState(undefined);
      }
    })();
    return () => {
      shutdown = true;
    };
    // Add any additional deps passed to this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [func, ...(deps ?? [])]);

  return state;
};
