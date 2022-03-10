import { GamePhase, useLupiContractContext } from "src/hooks/useLupiContract";
import { useRevealedTickets } from "src/hooks/useTickets";
import { Box, Grid, Text } from "src/ui";
import { GameStats } from "./GameStats";

export const RevealedGuesses = () => {
  const { phase, round } = useLupiContractContext();

  const {
    userRevealed,
    userUnrevealed,
    sortedRevealedGuesses,
    userLuckyNumber,
  } = useRevealedTickets();
  return (
    <Grid centerContent columns={1} border width={640}>
      <Box padding="md" centerContent border="after">
        {phase === GamePhase.REVEAL ? (
          <Text header="large" textTransform="uppercase">
            Round #{round} reveal progress
          </Text>
        ) : !sortedRevealedGuesses?.length ? (
          <Text header="large" textTransform="uppercase">
            Round #{round} was empty
          </Text>
        ) : (
          <Text header="large">Round {round} results</Text>
        )}
      </Box>
      {!!sortedRevealedGuesses.length && (
        <Box row padding="md" gap="md" centerContent border="after">
          {sortedRevealedGuesses?.map((g) => (
            <Text
              header="large"
              key={g}
              color={
                userLuckyNumber === g
                  ? "primary"
                  : userRevealed.includes(g)
                  ? "secondary"
                  : "text"
              }
            >
              {g}
            </Text>
          ))}
        </Box>
      )}

      <Box gap="md" padding="lg" centerContent>
        {userLuckyNumber ? (
          phase === GamePhase.ENDGAME ? (
            <>
              <Text
                header="regular"
                textTransform="uppercase"
                color="primary"
                align="center"
              >
                YOU ARE THE LUPI OF ROUND #{round}
              </Text>
            </>
          ) : (
            <>
              <Text
                header="regular"
                textTransform="uppercase"
                color="primary"
                align="center"
              >
                YOU ARE CURRENTLY THE LUPI, BUT...
              </Text>
              <Text color="muted" align="center">
                You are currently the lowest unique positive integer, but not
                all the tickets have been checked yet. The person with the
                lowest unique positive integer will receive the winnings in
                their wallet once the final LUPI is revealed.
              </Text>
            </>
          )
        ) : userRevealed.length ? (
          <Text color="muted" align="center">
            <Text span color="secondary"></Text>You are currently not the lowest
            unique positive integer. The person with the lowest unique positive
            integer will receive the winnings in their wallet once the final
            LUPI is revealed.
          </Text>
        ) : phase === GamePhase.REVEAL ? (
          userUnrevealed ? (
            <Text color="muted" align="center">
              You haven't revealed your tickets in this round. Make sure to
              upload your tickets before the end of the reveal phase!
            </Text>
          ) : (
            <Text color="muted" align="center">
              You haven't revealed any tickets in this round. If you haven't yet
              played you will need to wait until next round. Otherwise make sure
              to upload your tickets before the end of the reveal phase!
            </Text>
          )
        ) : (
          <Text color="muted" align="center">
            The round is over. Next round starting soon, hang in there.
          </Text>
        )}
      </Box>

      <GameStats noSpace />
    </Grid>
  );
};
