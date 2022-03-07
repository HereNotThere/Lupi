import { ethers, utils } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWeb3Context } from "./use_web3";
import LupiAbi from "../artifacts/contracts/Lupi.sol/Lupi.json";
import { Lupi } from "typechain-types";
import { notUndefined } from "../utils";
import { GameResultEvent } from "typechain-types/Lupi";

// Lupi on Rinkeby
const rinkebylupiAddress = "0xa586B7adE6E07FD3B5f1A5a37882D53c28791aDb";
const arbRinkebyAddress = "0x4951e6c53dE1FBe34baeF5d4Cd9BD3B417D7d577";
//const lupiAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
// const lupiAddress = "0x0B306BF915C4d645ff596e518fAf3F9669b97016";

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
        console.warn(`useContractCall failed`);
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
      default:
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
            const eventFilter = contract.filters.GameResult(); //.ContractEvent()
            const events = await contract.queryFilter(eventFilter, 0, "latest");
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
  }, [contract]);

  const transactionRunning = useRef(false);
  const callEndGame = useCallback(async () => {
    if (!transactionRunning.current && contractSigner) {
      transactionRunning.current = true;
      try {
        const transaction = await contractSigner.endGame();
        await transaction.wait();
      } finally {
        transactionRunning.current = false;
      }
    }
  }, [contractSigner]);

  const commitGuess = useCallback(
    async (guess: string) => {
      if (!transactionRunning.current && contractSigner && contract) {
        transactionRunning.current = true;
        try {
          const secret = ethers.utils.formatBytes32String("secret");

          const currentNonce = await contract.getCurrentNonce();
          const guessHash = getGuessHash(currentNonce, parseInt(guess), secret);
          const overrides = {
            value: ethers.utils.parseEther("0.01"),
          };

          const transaction = await contractSigner.commitGuess(
            guessHash,
            overrides
          );
          await transaction.wait();
        } finally {
          transactionRunning.current = false;
        }
      }
    },
    [contract, contractSigner]
  );

  const revealGuess = useCallback(
    async (revealedGuess: string) => {
      if (!transactionRunning.current && contractSigner && contract) {
        transactionRunning.current = true;
        try {
          const secret = ethers.utils.formatBytes32String("secret");
          const currentNonce = await contract.getCurrentNonce();
          const guessHash = getGuessHash(
            currentNonce,
            parseInt(revealedGuess),
            secret
          );
          const transaction = await contractSigner.revealGuesses([
            {
              guessHash,
              answer: revealedGuess,
              salt: secret,
            },
          ]);
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
    revealGuess,
  };
};
