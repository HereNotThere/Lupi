import { useCallback } from "react";
import { BigGreenButton } from "src/components/Buttons";
import { GameStats } from "src/components/GameStats";
import { Spinner } from "src/components/Spinner";
import { TicketStack } from "src/components/TicketStack";
import { useLupiContractContext } from "src/hooks/useLupiContract";
import { useTicketList } from "src/hooks/useTickets";
import { Box, Grid, Text } from "src/ui";

export const RevealPhase = () => {
  const { round, revealGuesses, guessHashes, revealGuessesState } =
    useLupiContractContext();
  const ticketList = useTicketList(guessHashes);
  const revealAll = useCallback(async () => {
    await revealGuesses(ticketList);
  }, [revealGuesses, ticketList]);

  const isChecking = revealGuessesState.type === "Running";
  const submitText = !isChecking
    ? `Check ${ticketList.length > 1 ? ticketList.length : ""} ticket${
        ticketList.length > 1 ? "s" : ""
      }`
    : "";
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
      <Box grow centerContent gap="lg">
        {!ticketList.length ? (
          <>
            <Text header="large">{"Check if you are the LUPI"}</Text>
            <BigGreenButton>Upload your tickets</BigGreenButton>
          </>
        ) : (
          <>
            <TicketStack tickets={ticketList} />
            <BigGreenButton
              centerContent
              onClick={revealAll}
              icon={isChecking && <Spinner />}
            >
              {submitText}
            </BigGreenButton>
          </>
        )}
      </Box>
    </Grid>
  );
};
