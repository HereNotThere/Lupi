import { PageTransition } from "src/components/FadeBox";
import { GamePhase, useLupiContractContext } from "src/hooks/useLupiContract";
import { EndGamePhase } from "./phases/EndPhase";
import { GuessPhase } from "./phases/GuessPhase";
import { RevealPhase } from "./phases/RevealPhase";

const getGamePhaseComponent = (phase: GamePhase) => {
  switch (phase) {
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

export const GamePhases = () => {
  const { phase } = useLupiContractContext();

  const phaseComponent = getGamePhaseComponent(phase);

  return (
    <PageTransition key={`phase${phase}`}>{phaseComponent}</PageTransition>
  );
};
