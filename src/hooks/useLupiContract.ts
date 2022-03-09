import { ethers, utils } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWeb3Context } from "./useWeb3";
import LupiAbi from "../artifacts/contracts/Lupi.sol/Lupi.json";
import { Lupi } from "typechain-types";
import { notUndefined } from "../utils";
import { GameResultEvent } from "typechain-types/Lupi";
import { TicketData } from "../schema/Ticket";
import { useContractCall } from "./useContractCall";

// Lupi on Rinkeby
const rinkebylupiAddress = "0xa586B7adE6E07FD3B5f1A5a37882D53c28791aDb";
const arbRinkebyAddress = "0xc5F00783eC69fF73Db9a6085C49c7F07253872de";
const hhAddress = process.env.REACT_APP_HARDHAT_ADDRESS;
// const lupiAddress = "0x0B306BF915C4d645ff596e518fAf3F9669b97016";

export enum GamePhase {
  GUESS,
  REVEAL,
  ENDGAME,
}

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
type TransactionState =
  | IdleTransaction
  | RunningTransaction
  | FailedTransaction
  | CompletedTransaction;

type Overrides =
  | (ethers.PayableOverrides & {
      from?: string | Promise<string> | undefined;
    })
  | undefined;

type ContractFunction0<R> = (overrides?: Overrides) => Promise<R>;
type ContractFunction1<T0, R> = (arg0: T0, overrides?: Overrides) => Promise<R>;

function useContractTransact1<T0>(
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

function useContractTransact0(
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

function getGuessHash(currentNonce: string, guess: number, salt: string) {
  return utils.solidityKeccak256(
    ["bytes32", "uint32", "bytes32"],
    [currentNonce, guess, salt]
  );
}

export const useLupiContract = () => {
  const { provider, chainId } = useWeb3Context();

  const lupiAddress = useMemo(() => {
    console.log(`chainId ${chainId}`);
    switch (chainId) {
      case "0x66eeb":
        return arbRinkebyAddress;
      case "0x4":
        return rinkebylupiAddress;
      case "0x7a69":
        console.log(
          "useLupiContract::useLupiContractconnecting to hardhat",
          hhAddress
        );
        return hhAddress;
      default:
        console.warn("useLupiContract::connecting to unhandled network");
        return undefined;
    }
  }, [chainId]);

  const signer = useMemo(() => provider?.getSigner(), [provider]);
  const contract = useMemo(
    () =>
      provider && lupiAddress
        ? (new ethers.Contract(lupiAddress, LupiAbi.abi, provider) as Lupi)
        : undefined,
    [provider, lupiAddress]
  );

  const contractSigner = useMemo(
    () =>
      signer && lupiAddress
        ? (new ethers.Contract(lupiAddress, LupiAbi.abi, signer) as Lupi)
        : undefined,
    [signer, lupiAddress]
  );

  const currentBalance = useContractCall(contract?.getCurrentBalance);
  const rolloverBalance = useContractCall(contract?.getRolloverBalance);
  const round = useContractCall(contract?.getRound);
  const phase = useContractCall(contract?.getPhase);
  const phaseDeadline = useContractCall(contract?.getPhaseDeadline);
  const players = useContractCall(contract?.getPlayers);
  const revealedGuesses = useContractCall(contract?.getRevealedGuess);

  const getGuessHashes = useCallback(async () => {
    try {
      const getPlayers = players
        ?.map((player) => contract?.getCommittedGuessHashes(player))
        .filter(notUndefined);
      const res = getPlayers ? await Promise.all(getPlayers) : undefined;

      return res?.flatMap((p) => p).filter(notUndefined);
    } catch {
      console.warn(`getCommittedGuessHashes failed`);
    }
  }, [contract, players]);

  const guessHashes = useContractCall(getGuessHashes);

  const [finishedGames, setFinishedGames] = useState<GameResultEvent[]>([]);

  useEffect(() => {
    try {
      let shutdown = false;
      void (async () => {
        try {
          if (contract) {
            console.log(`fetching events`);
            const minBlock =
              (await contract.provider.getBlockNumber()) - 100000;

            /*
            const topicId = utils.id(
              "GameResult(uint32,address,uint256,uint32)"
            );
            const topicNameId = utils.id("GameResult");
              */
            const logs = await contract.provider.getLogs({
              fromBlock: minBlock,
              toBlock: "latest",
              address: lupiAddress,
            });
            console.log(`logs ${logs}`, logs);

            /*
              contract.provider.lookupAddress[
                "GameResult(uint32,address,uint256,uint32)"
              ](); //.ContractEvent()
              */
            const eventFilter = { address: lupiAddress };
            console.log(`eventFilter ${eventFilter}`, eventFilter);
            const events = await contract.queryFilter(
              eventFilter,
              minBlock,
              "latest"
            );
            console.log(`events ${events}`, events);
            if (!shutdown) {
              setFinishedGames(events);
            }
          }
        } catch (err) {
          console.warn(`contract filtering by GameResult failed`, err);
          setFinishedGames([]);
        }
      })();
      return () => {
        shutdown = true;
      };
    } catch (err) {
      console.warn(`GameResult failed`);
    }
  }, [contract, lupiAddress]);

  const [invokeCallEndGame, callEndGameState] = useContractTransact0(
    contractSigner?.endGame
  );
  const callEndGame = useCallback(async (): Promise<void> => {
    await invokeCallEndGame();
  }, [invokeCallEndGame]);

  const [invokeCommitGuess, commitGuessState] = useContractTransact1(
    contractSigner?.commitGuess
  );

  const commitGuess = useCallback(
    async (guess: number): Promise<TicketData | undefined> => {
      if (contractSigner && contract) {
        try {
          const bytes = ethers.utils.randomBytes(32);
          const salt = ethers.utils.hexlify(bytes);

          const currentNonce = await contract.getCurrentNonce();
          const roundId = await contract.getRound();

          const guessHash = getGuessHash(currentNonce, guess, salt);
          const overrides = {
            value: ethers.utils.parseEther("0.01"),
          };

          const result = await invokeCommitGuess(guessHash, overrides);
          if (result.type === "Completed") {
            return {
              roundId,
              guess,
              salt,
            };
          } else {
            return undefined;
          }
        } catch (err) {
          console.log(`commitGuess failed ${err}`, err);
        }
      }
    },
    [contract, contractSigner, invokeCommitGuess]
  );

  const [invokeRevealGuesses, revealGuessesState] = useContractTransact1(
    contractSigner?.revealGuesses
  );

  const revealGuesses = useCallback(
    async (tickets: TicketData[]) => {
      if (contractSigner && contract) {
        try {
          const currentNonce = await contract.getCurrentNonce();
          const currentRound = await contract.getRound();
          const reveals = tickets.map((t) => {
            if (t.roundId !== currentRound) {
              throw new Error(
                `Reveal for round ${t.roundId} not for current round $${currentRound}`
              );
            }
            const guessHash = getGuessHash(currentNonce, t.guess, t.salt);
            return {
              guessHash,
              round: t.roundId,
              answer: t.guess,
              salt: t.salt,
            };
          });
          await invokeRevealGuesses(reveals);
        } catch (err) {
          console.error(`error in revealGuesses`, err);
        }
      }
    },
    [contract, contractSigner, invokeRevealGuesses]
  );

  return {
    round,
    phase,
    phaseDeadline,
    currentBalance,
    rolloverBalance,
    players,
    guessHashes,
    finishedGames,
    revealedGuesses,
    callEndGame,
    callEndGameState,
    commitGuess,
    commitGuessState,
    revealGuesses,
    revealGuessesState,
  };
};
