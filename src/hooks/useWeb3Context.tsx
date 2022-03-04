import { ethers } from "ethers";
import { ReactNode, useCallback } from "react";
import { createGenericContext } from "src/utils/createGenericContext";
import Lupi from "../artifacts/contracts/Lupi.sol/Lupi.json";

export enum GamePhase {
  UNSYNCED = -1,
  GUESS = 0,
  REVEAL = 1,
  ENDGAME = 2,
}

declare let window: { ethereum: any };

const [useWeb3Context, Web3ContextProvider] = createGenericContext<UseWeb3>();

const Web3Provider = ({ children }: { children: ReactNode }): JSX.Element => {
  const web3 = useWeb3();
  return <Web3ContextProvider value={web3}>{children}</Web3ContextProvider>;
};

export { useWeb3Context, Web3Provider };

export type UseWeb3 = ReturnType<typeof useWeb3>;

const lupiAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const getProvider = () => {
  if (typeof window.ethereum === "undefined") {
    return;
  }
  return new ethers.providers.Web3Provider(window.ethereum);
};

const getContract = (signed: boolean) => {
  const provider = getProvider();
  if (!provider) {
    throw new Error("no provider");
  }
  const signerOrProvider = signed ? provider.getSigner() : provider;
  const contract = new ethers.Contract(lupiAddress, Lupi.abi, signerOrProvider);
  return contract;
};

export interface GameData {
  currentBalance: number;
  phase: number;
  phaseDeadLine: Date;
  players: string[];
  roundId: number;
  maxGuess: number;
}

export const isValidGameData = (game?: GameData): game is GameData => {
  return (
    typeof game !== "undefined" &&
    typeof game.currentBalance !== undefined &&
    typeof game.phase !== undefined &&
    typeof game.phaseDeadLine !== undefined &&
    typeof game.players !== undefined &&
    typeof game.roundId !== undefined
  );
};

const useWeb3 = () => {
  const getGameData = useCallback(async () => {
    const contract = await getContract(false);
    const result = await Promise.all([
      contract.getRound().then((roundId: number) => ({
        roundId,
      })),
      contract.getPhase().then((phase: number) => ({
        phase,
      })),
      contract.getPlayers().then((players: number) => ({
        players,
      })),
      contract.getCurrentBalance().then((currentBalance: number) => ({
        currentBalance: currentBalance * 1,
      })),
      contract.getPhaseDeadline().then(
        (phaseDeadLine: number) =>
          ({
            phaseDeadLine: new Date(Date.now() + 1000 * phaseDeadLine),
          } as const)
      ),
    ]).then((response) =>
      response.reduce((keep, current) => ({ ...keep, ...current }), {
        maxGuess: 999,
      })
    );

    return isValidGameData(result) ? result : null;
  }, []);
  return { getGameData } as const;
};
