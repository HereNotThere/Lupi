import { BigGreyButton } from "src/components/Buttons";
import { RevealedGuesses } from "src/components/RevealedGuesses";
import { useLupiContractContext } from "src/hooks/useLupiContract";
import { Box, Grid } from "src/ui";

export const EndGamePhase = () => {
  const { callEndGame } = useLupiContractContext();
  return (
    <Grid columns={1} grow>
      <Box grow gap="lg" minHeight={400} centerContent>
        <RevealedGuesses />
        <BigGreyButton onClick={() => callEndGame()}>
          Call End Game
        </BigGreyButton>
      </Box>
    </Grid>
  );
};
