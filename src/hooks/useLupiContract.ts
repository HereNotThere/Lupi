import { ethers, utils } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWeb3Context } from "./useWeb3";
import LupiAbi from "../artifacts/contracts/Lupi.sol/Lupi.json";
import { Lupi } from "typechain-types";
import { notUndefined } from "../utils";
import { GameResultEvent } from "typechain-types/Lupi";
import { TicketData } from "../schema/Ticket";

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

export const useContractCall = <T>(func?: () => Promise<T> | undefined) => {
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
  }, [func]);

  return state;
};

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

  const transactionRunning = useRef(false);
  const callEndGame = useCallback(async () => {
    if (!transactionRunning.current && contractSigner) {
      transactionRunning.current = true;
      try {
        const transaction = await contractSigner.endGame();
        await transaction.wait();
      } catch (err) {
        console.log(`endGame failed ${err}`, err);
      } finally {
        transactionRunning.current = false;
      }
    }
  }, [contractSigner]);

  const commitGuess = useCallback(
    async (guess: number): Promise<TicketData | undefined> => {
      if (!transactionRunning.current && contractSigner && contract) {
        transactionRunning.current = true;
        try {
          const bytes = ethers.utils.randomBytes(32);
          const salt = ethers.utils.hexlify(bytes);

          const currentNonce = await contract.getCurrentNonce();
          const roundId = await contract.getRound();

          const guessHash = getGuessHash(currentNonce, guess, salt);
          const overrides = {
            value: ethers.utils.parseEther("0.01"),
          };

          const transaction = await contractSigner.commitGuess(
            guessHash,
            overrides
          );
          await transaction.wait();
          return {
            roundId,
            guess,
            salt,
          };
        } catch (err) {
          console.log(`commitGuess failed ${err}`, err);
        } finally {
          transactionRunning.current = false;
        }
      }
    },
    [contract, contractSigner]
  );

  const revealGuesses = useCallback(
    async (tickets: TicketData[]) => {
      if (!transactionRunning.current && contractSigner && contract) {
        transactionRunning.current = true;
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
          const transaction = await contractSigner.revealGuesses(reveals);
          await transaction.wait();
        } finally {
          transactionRunning.current = false;
        }
      }
    },
    [contract, contractSigner]
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
    commitGuess,
    revealGuesses,
  };
};
