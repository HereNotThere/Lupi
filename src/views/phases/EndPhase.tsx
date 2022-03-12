import { BigGreyButton } from "src/components/Buttons";
import { FadeBox } from "src/components/FadeBox";
import { RevealedGuesses } from "src/components/RevealedGuesses";
import { Spinner } from "src/components/Spinner";
import { useLupiContractContext } from "src/hooks/useLupiContract";
import { Box } from "src/ui";

export const EndGamePhase = () => {
  const { callEndGame, callEndGameState } = useLupiContractContext();
  const isComitting = callEndGameState.type === "Running";
  const submitText = !isComitting ? `Start New Game` : ``;

  return (
    <Box grow gap="lg" minHeight={400} centerContent>
      <FadeBox>
        <RevealedGuesses />
      </FadeBox>
      <FadeBox>
        <BigGreyButton
          minWidth={320}
          onClick={() => callEndGame()}
          icon={isComitting && <Spinner />}
        >
          {submitText}
        </BigGreyButton>
      </FadeBox>
    </Box>
  );
};
