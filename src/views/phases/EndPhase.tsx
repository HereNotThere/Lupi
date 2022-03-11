import { BigGreyButton } from "src/components/Buttons";
import { RevealedGuesses } from "src/components/RevealedGuesses";
import { Spinner } from "src/components/Spinner";
import { useLupiContractContext } from "src/hooks/useLupiContract";
import { Box, Grid } from "src/ui";

export const EndGamePhase = () => {
  const { callEndGame, callEndGameState } = useLupiContractContext();
  const isComitting = callEndGameState.type === "Running";
  const submitText = !isComitting ? `Start New Game` : ``;

  return (
    <Grid columns={1} grow>
      <Box grow gap="lg" minHeight={400} centerContent>
        <RevealedGuesses />
        <BigGreyButton
          minWidth={320}
          onClick={() => callEndGame()}
          icon={isComitting && <Spinner />}
        >
          {submitText}
        </BigGreyButton>
      </Box>
    </Grid>
  );
};
