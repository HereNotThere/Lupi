import { ethers, utils } from "ethers";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useWeb3Context } from "./useWeb3";
import LupiAbi from "../artifacts/contracts/Lupi.sol/Lupi.json";
import { Lupi } from "typechain-types";
import { GameResultEvent } from "typechain-types/Lupi";
import { TicketData } from "../schema/Ticket";
import { useContractCall } from "./useContractCall";
import {
  useContractTransact0,
  useContractTransact1,
} from "./useContractTransact";
import { createGenericContext } from "../utils/createGenericContext";

// Lupi on Rinkeby
const rinkebylupiAddress = "0xa586B7adE6E07FD3B5f1A5a37882D53c28791aDb";
const arbRinkebyAddress = "0x36b372b5495A2e991dd832a2d4bb79638629cF10";
const hhAddress = process.env.REACT_APP_HARDHAT_ADDRESS;
// const lupiAddress = "0x0B306BF915C4d645ff596e518fAf3F9669b97016";

export enum GamePhase {
  GUESS,
  REVEAL,
  ENDGAME,
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

export const useLupiContract = () => {
  const [forceRefreshDep, setUnusedState] = useState({});
  const forceUpdate = useCallback(() => setUnusedState({}), []);

  useEffect(() => {
    const refresher = setInterval(() => forceUpdate(), 60 * 1000);
    return () => clearInterval(refresher);
  }, [forceUpdate]);
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

  const currentBalance = useContractCall(contract?.getCurrentBalance, [
    forceRefreshDep,
  ]);
  const rolloverBalance = useContractCall(contract?.getRolloverBalance, [
    forceRefreshDep,
  ]);
  const round = useContractCall(contract?.getRound, [forceRefreshDep]);
  const phase = useContractCall(contract?.getPhase, [forceRefreshDep]);
  const phaseDeadline = useContractCall(contract?.getPhaseDeadline, [
    forceRefreshDep,
  ]);
  const players = useContractCall(contract?.getPlayers, [forceRefreshDep]);
  const revealedGuesses = useContractCall(contract?.getRevealedGuess, [
    forceRefreshDep,
  ]);

  const getGuessHashes = useCallback(async () => {
    try {
      return await contract?.getCommittedGuessHashes();
    } catch (err) {
      console.warn(`getCommittedGuessHashes failed`, err);
    }
  }, [contract]);

  const guessHashes = useContractCall(getGuessHashes, [forceRefreshDep]);

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
      console.warn(`GameResult failed`, err);
    }
  }, [contract, lupiAddress]);

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
          forceUpdate();

          if (result.type === "Completed") {
            return {
              roundId,
              guess,
              salt,
              guessHash,
            };
          } else {
            return undefined;
          }
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
    lupiAddress,
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
