import { ethers, PayableOverrides } from "ethers";
import { useState, useRef, useCallback } from "react";

type IdleTransaction = {
  type: "Idle";
};
type RunningTransaction = {
  type: "Running";
  startTime: number;
};
type FailedTransaction = {
  type: "Failed";
  error: Error;
};
type CompletedTransaction = {
  type: "Completed";
  startTime: number;
  endTime: number;
  result: ethers.ContractReceipt;
};

export type TransactionState =
  | IdleTransaction
  | RunningTransaction
  | FailedTransaction
  | CompletedTransaction;

type Overrides = PayableOverrides & {
  from?: string | Promise<string> | undefined;
};

type ContractFunction0<R> = (overrides?: Overrides) => Promise<R>;
type ContractFunction1<T0, R> = (arg0: T0, overrides?: Overrides) => Promise<R>;

// TODO figur out how to collapse these into overriden versions of useContractTransact
export function useContractTransact0(
  func?: ContractFunction0<ethers.ContractTransaction>
): [ContractFunction0<TransactionState>, TransactionState] {
  const [transaction, setTransaction] = useState<TransactionState>({
    type: "Idle",
  });

  const transactionRunning = useRef(0);

  const invoke = useCallback(
    async (overrides?: Overrides): Promise<TransactionState> => {
      if (func) {
        if (transactionRunning.current === 0) {
          try {
            transactionRunning.current = Date.now();
            setTransaction({
              type: "Running",
              startTime: transactionRunning.current,
            });
            const transaction = overrides
              ? await func(overrides)
              : await func();
            const result = await transaction.wait();
            setTransaction({
              type: "Completed",
              startTime: transactionRunning.current,
              endTime: Date.now(),
              result,
            });
            console.log(`setTransaction Completed`);
            return {
              type: "Completed",
              startTime: transactionRunning.current,
              endTime: Date.now(),
              result,
            };
          } catch (error) {
            setTransaction({ type: "Failed", error: error as Error });
            return { type: "Failed", error: error as Error };
          } finally {
            transactionRunning.current = 0;
          }
        } else {
          return {
            type: "Running",
            startTime: transactionRunning.current,
          };
        }
      } else {
        return { type: "Failed", error: new Error("No function provided") };
      }
    },
    [func]
  );
  return [invoke, transaction];
}

export function useContractTransact1<T0>(
  func?: ContractFunction1<T0, ethers.ContractTransaction>
): [ContractFunction1<T0, TransactionState>, TransactionState] {
  const [transaction, setTransaction] = useState<TransactionState>({
    type: "Idle",
  });

  const transactionRunning = useRef(0);

  const invoke = useCallback(
    async (arg0: T0, overrides?: Overrides): Promise<TransactionState> => {
      if (func) {
        if (transactionRunning.current === 0) {
          try {
            transactionRunning.current = Date.now();
            setTransaction({
              type: "Running",
              startTime: transactionRunning.current,
            });
            const transaction = overrides
              ? await func(arg0, overrides)
              : await func(arg0);
            const result = await transaction.wait();
            setTransaction({
              type: "Completed",
              startTime: transactionRunning.current,
              endTime: Date.now(),
              result,
            });
            console.log(`setTransaction Completed`);
            return {
              type: "Completed",
              startTime: transactionRunning.current,
              endTime: Date.now(),
              result,
            };
          } catch (error) {
            setTransaction({ type: "Failed", error: error as Error });
            return { type: "Failed", error: error as Error };
          } finally {
            transactionRunning.current = 0;
          }
        } else {
          return {
            type: "Running",
            startTime: transactionRunning.current,
          };
        }
      } else {
        return { type: "Failed", error: new Error("No function provided") };
      }
    },
    [func]
  );
  return [invoke, transaction];
}
