import { BigNumber, ethers, utils } from "ethers";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useWeb3Context } from "./useWeb3";
import LupiAbi from "../artifacts/contracts/Lupi.sol/Lupi.json";
import { Lupi } from "typechain-types";
import { GameResultEvent } from "typechain-types/Lupi";
import { TicketData } from "../schema/Ticket";
import { useContractCall } from "./useContractCall";
import {
  TransactionState,
  useContractTransact0,
  useContractTransact1,
} from "./useContractTransact";
import { createGenericContext } from "../utils/createGenericContext";

//const rinkebyAddress = "0x60a5d60D9173f788D3caF27a86193c2418A5F90D";
//const arbRinkebyAddress = "0xFc8e5F235d2597576669A328f9a9366e0dA845d3";
const arbAddress = "0x4951e6c53dE1FBe34baeF5d4Cd9BD3B417D7d577";
const hhAddress = process.env.REACT_APP_HARDHAT_ADDRESS;
// const lupiAddress = "0x0B306BF915C4d645ff596e518fAf3F9669b97016";

export enum GamePhase {
  GUESS,
  REVEAL,
  ENDGAME,
  UNKNOWN,
}

export function getGuessHash(
  currentNonce: string,
  guess: number,
  salt: string
) {
  return utils.solidityKeccak256(
    ["bytes32", "uint32", "bytes32"],
    [currentNonce, guess, salt]
  );
}

function bigNumberToDate(bn: BigNumber) {
  try {
    return new Date(bn.toNumber() * 1000).toLocaleString();
  } catch {
    return "Invalid date: " + bn.toString();
  }
}
export function contractStateFormatter(
  state:
    | {
        blockTimestamp: BigNumber;
        currentRound: number;
        nonce: string;
        guessDeadline: BigNumber;
        revealDeadline: BigNumber;
        balance: BigNumber;
        commitedGuesses: Lupi.AllCommitedGuessStructOutput[];
        revealedGuesses: Lupi.RevealedGuessStructOutput[];
        players: string[];
      }
    | undefined
) {
  if (state) {
    const {
      blockTimestamp,
      currentRound,
      nonce,
      guessDeadline,
      revealDeadline,
      balance,
      commitedGuesses,
      revealedGuesses,
      players,
    } = state;
    return JSON.stringify({
      blockTimestamp: bigNumberToDate(blockTimestamp),
      currentRound,
      nonce,
      guessDeadline: bigNumberToDate(guessDeadline),
      revealDeadline: bigNumberToDate(revealDeadline),
      balance: balance.toString(),
      commitedGuesses,
      revealedGuesses,
      players,
    });
  } else {
    return undefined;
  }
}
const [useLupiContractContext, LupiContractContextProvider] =
  createGenericContext<UseLupiContract>();

export const LupiContractProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => {
  const lupi = useLupiContract();
  return (
    <LupiContractContextProvider value={lupi}>
      {children}
    </LupiContractContextProvider>
  );
};

export { useLupiContractContext, LupiContractContextProvider };

export type UseLupiContract = ReturnType<typeof useLupiContract>;

export const supportedChain = (chainId: string | undefined) => {
  switch (chainId) {
    case undefined:
      return undefined;
    case "0xa4b1":
      return arbAddress;
    /*
    case "0x66eeb":
      return arbRinkebyAddress;
    case "0x4":
      return rinkebyAddress;
      */
    case "0x7a69":
      console.log(
        "useLupiContract::useLupiContractconnecting to hardhat",
        hhAddress
      );
      return hhAddress;
    default:
      console.warn("useLupiContract::connecting to unhandled network", chainId);
      return undefined;
  }
};
export const useLupiContract = () => {
  const [forceRefreshDep, setUnusedState] = useState({});
  const forceUpdate = useCallback(() => setUnusedState({}), []);

  useEffect(() => {
    const refresher = setInterval(() => forceUpdate(), 60 * 1000);
    return () => clearInterval(refresher);
  }, [forceUpdate]);
  const { provider, chainId } = useWeb3Context();

  const contractAddress = useMemo(() => supportedChain(chainId), [chainId]);

  const signer = useMemo(() => provider?.getSigner(), [provider]);
  const contract = useMemo(
    () =>
      provider && contractAddress
        ? (new ethers.Contract(contractAddress, LupiAbi.abi, provider) as Lupi)
        : undefined,
    [provider, contractAddress]
  );

  const contractSigner = useMemo(
    () =>
      signer && contractAddress
        ? (new ethers.Contract(contractAddress, LupiAbi.abi, signer) as Lupi)
        : undefined,
    [signer, contractAddress]
  );

  const contractState = useContractCall(contract?.getCurrentState, [
    forceRefreshDep,
  ]);

  const currentBalance = useMemo(
    () => contractState?.balance,
    [contractState?.balance]
  );
  const rolloverBalance = useContractCall(contract?.getRolloverBalance, [
    forceRefreshDep,
  ]);
  const round = useContractCall(contract?.getRound, [forceRefreshDep]);

  const phase = useMemo(() => {
    if (contractState) {
      const { blockTimestamp, guessDeadline, revealDeadline } = contractState;
      if (blockTimestamp.lte(guessDeadline)) {
        return GamePhase.GUESS;
      } else if (blockTimestamp.lte(revealDeadline)) {
        return GamePhase.REVEAL;
      } else {
        return GamePhase.ENDGAME;
      }
    } else {
      return GamePhase.UNKNOWN;
    }
  }, [contractState]);

  const phaseDeadline = useMemo(() => {
    if (contractState) {
      const { blockTimestamp, guessDeadline, revealDeadline } = contractState;
      if (blockTimestamp.lte(guessDeadline)) {
        return guessDeadline;
      } else if (blockTimestamp.lte(revealDeadline)) {
        return revealDeadline;
      } else {
        return BigNumber.from(0);
      }
    } else {
      return BigNumber.from(0);
    }
  }, [contractState]);

  const revealedGuesses = useMemo(
    () => contractState?.revealedGuesses,
    [contractState]
  );

  const guessHashes = useMemo(
    () => contractState?.commitedGuesses,
    [contractState?.commitedGuesses]
  );
  const [finishedGames, setFinishedGames] = useState<
    {
      timestamp: number;
      round: number;
      award: BigNumber;
      lowestGuess: number;
      winner: string;
    }[]
  >();

  useEffect(() => {
    if (contract) {
      try {
        let shutdown = false;
        void (async () => {
          try {
            const minBlock =
              (await contract.provider.getBlockNumber()) - 100000;
            if (shutdown) {
              return;
            }

            const eventFilter = { address: contract.address };
            const events = await contract.queryFilter<GameResultEvent>(
              eventFilter,
              minBlock,
              "latest"
            );
            if (shutdown) {
              return;
            }

            const resolvedEvents = await Promise.all(
              events.map(async (e) => {
                const block = await e.getBlock();
                return {
                  timestamp: block.timestamp,
                  round: e.args.round,
                  award: e.args.award,
                  lowestGuess: e.args.lowestGuess,
                  winner: e.args.winner,
                };
              })
            );
            if (shutdown) {
              return;
            }

            if (!shutdown) {
              setFinishedGames(resolvedEvents);
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
        console.warn(`GameResult failed`, err);
      }
    }
  }, [contract, forceRefreshDep]);

  const [invokeCallEndGame, callEndGameState] = useContractTransact0(
    contractSigner?.endGame
  );
  const callEndGame = useCallback(async (): Promise<void> => {
    await invokeCallEndGame();
    forceUpdate();
  }, [forceUpdate, invokeCallEndGame]);

  const [invokeCommitGuess, commitGuessState] = useContractTransact1(
    contractSigner?.commitGuess
  );

  const commitGuess = useCallback(
    async (
      guess: number
    ): Promise<
      { result: Promise<TransactionState>; ticket: TicketData } | undefined
    > => {
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

          const result = (async () => {
            const result = invokeCommitGuess(guessHash, overrides);
            forceUpdate();
            return result;
          })();

          return {
            result,
            ticket: {
              roundId,
              guess,
              salt,
              guessHash,
            },
          };
        } catch (err) {
          console.log(`commitGuess failed ${err}`, err);
        }
      }
    },
    [contract, contractSigner, forceUpdate, invokeCommitGuess]
  );

  const [invokeRevealGuesses, revealGuessesState] = useContractTransact1(
    contractSigner?.revealGuesses
  );

  const revealGuesses = useCallback(
    async (tickets: TicketData[]) => {
      if (contractSigner && contract) {
        try {
          const reveals = tickets.map((t) => {
            return {
              guessHash: t.guessHash,
              round: t.roundId,
              answer: t.guess,
              salt: t.salt,
            };
          });
          await invokeRevealGuesses(reveals);
          forceUpdate();
        } catch (err) {
          console.error(`error in revealGuesses`, err);
        }
      }
    },
    [contract, contractSigner, forceUpdate, invokeRevealGuesses]
  );

  return {
    contractAddress,
    round,
    phase,
    phaseDeadline,
    currentBalance,
    rolloverBalance,
    guessHashes,
    finishedGames,
    revealedGuesses,
    callEndGame,
    callEndGameState,
    commitGuess,
    commitGuessState,
    revealGuesses,
    revealGuessesState,
    contractState,
  };
};
