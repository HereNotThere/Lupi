import { GamePhase, useLupiContractContext } from "src/hooks/useLupiContract";
import { EndGamePhase } from "./phases/EndPhase";
import { GuessPhase } from "./phases/GuessPhase";
import { RevealPhase } from "./phases/RevealPhase";

export const GamePhases = () => {
  const { phase } = useLupiContractContext();

  switch (false ? 1 : phase) {
    case GamePhase.GUESS: {
      return <GuessPhase />;
    }
    case GamePhase.REVEAL: {
      return <RevealPhase />;
    }
    case GamePhase.ENDGAME: {
      return <EndGamePhase />;
    }
    default: {
      return <></>;
    }
  }
};
