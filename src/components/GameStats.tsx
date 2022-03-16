import { useMemo } from "react";
import { GamePhase, useLupiContractContext } from "src/hooks/useLupiContract";
import { Box, Grid, Text } from "src/ui";
import { getHumanDate } from "src/utils/lupiUtils";
import { Lupi } from "typechain-types";
import { EthText } from "./EthText";

export const getEntryCount = (
  guessHashes: Lupi.AllCommitedGuessStructOutput[] | undefined,
  showUnrevealed: boolean
) =>
  guessHashes?.reduce(
    (k, u) =>
      k +
        u.commitedGuesses.filter((g) => g.revealed || showUnrevealed).length ??
      0,
    0
  );

export const GameStats = (props: { noSpace?: boolean }) => {
  const { noSpace } = props;
  const {
    guessHashes,
    currentBalance,
    rolloverBalance,
    guessDeadline,
    revealDeadline,
    phase,
  } = useLupiContractContext();

  const showUnrevealed = phase === GamePhase.GUESS;
  const entryCount = getEntryCount(guessHashes, showUnrevealed);

  const { guessPhaseTimestamp, revealPhaseTimestamp } = useMemo(() => {
    return {
      guessPhaseTimestamp: guessDeadline?.toNumber()
        ? getHumanDate(new Date(guessDeadline?.toNumber() * 1000))
        : "",
      revealPhaseTimestamp: revealDeadline?.toNumber()
        ? getHumanDate(new Date(revealDeadline?.toNumber() * 1000))
        : "",
    };
  }, [guessDeadline, revealDeadline]);

  const wei = currentBalance?.add(rolloverBalance ?? 0);

  return (
    <Grid
      columns={2}
      gap={noSpace ? false : "sm"}
      alignContent="center"
      alignItems="center"
      border={noSpace ? "before" : false}
      row
    >
      <Box
        padding={noSpace ? "md" : "sm"}
        border={!noSpace ? true : "after"}
        centerContent
        gap="xs"
      >
        <Text header="small">
          {phase === GamePhase.ENDGAME ? "Jackpot" : "Current Jackpot"}
        </Text>
        <EthText wei={wei} header="regular" color="primary" />
      </Box>
      <Box
        padding={noSpace ? "md" : "sm"}
        gap="xs"
        border={!noSpace}
        centerContent
      >
        <Text header="small">
          {phase === GamePhase.GUESS ? "Entries" : "Revealed Entries"}
        </Text>
        <Text header="regular" color="primary">
          {entryCount}
        </Text>
      </Box>
      {phase === GamePhase.GUESS && (
        <Box
          padding={noSpace ? "md" : "sm"}
          border
          centerContent
          gap="xs"
          cols={2}
        >
          <Text header="small">Approximate Guess Deadline</Text>
          <Text header="regular" color="primary">
            {guessPhaseTimestamp}
          </Text>
        </Box>
      )}
      {(phase === GamePhase.GUESS || phase === GamePhase.REVEAL) &&
        !!revealDeadline && (
          <Box
            padding={noSpace ? "md" : "sm"}
            border
            centerContent
            gap="xs"
            cols={2}
          >
            <Text header="small">Approximate Reveal Deadline</Text>
            <Text header="regular" color="primary">
              {revealPhaseTimestamp}
            </Text>
          </Box>
        )}
    </Grid>
  );
};
