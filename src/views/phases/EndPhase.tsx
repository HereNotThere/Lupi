import { BigGreyButton } from "src/components/Buttons";
import { GameStats } from "src/components/GameStats";
import { useLupiContractContext } from "src/hooks/useLupiContract";
import { Box, Grid, Text } from "src/ui";

export const EndGamePhase = () => {
  const { callEndGame, revealedGuesses, round } = useLupiContractContext();

  return (
    <Grid columns={2} grow>
      {/* left column */}
      <Box centerContent>
        <Grid columns={1} gap="md">
          <Text header="large" align="center">
            Round {round}
          </Text>
          <GameStats />
        </Grid>
      </Box>
      {/* right column */}
      <Box grow gap="lg" minHeight={400} centerContent>
        {revealedGuesses?.length ? (
          <Box row gap="md">
            {revealedGuesses?.map((g) => (
              <Text header="large">{g.toNumber()}</Text>
            ))}
          </Box>
        ) : (
          <></>
        )}
        <BigGreyButton onClick={() => callEndGame()}>
          Call End Game
        </BigGreyButton>
      </Box>
    </Grid>
  );
};
