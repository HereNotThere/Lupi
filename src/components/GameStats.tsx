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
  const { guessHashes, currentBalance, rolloverBalance, phaseDeadline, phase } =
    useLupiContractContext();

  const showUnrevealed = phase === GamePhase.GUESS;
  const entryCount = getEntryCount(guessHashes, showUnrevealed);

  const phaseEndTimestamp = useMemo(
    () =>
      phaseDeadline?.toNumber()
        ? getHumanDate(new Date(phaseDeadline.toNumber() * 1000))
        : "",
    [phaseDeadline]
  );

  const endGameTimestamp = useMemo(
    () =>
      phase === GamePhase.GUESS && phaseDeadline?.toNumber()
        ? // NOTE: the following estimate is based on the assumption the reveal deadline
          // occurs one day after guessing phase is over. If the contract gets updated
          // this needs to be amended too.
          getHumanDate(
            new Date((60 * 60 * 24 + phaseDeadline.toNumber()) * 1000)
          )
        : "",
    [phase, phaseDeadline]
  );

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
      {phaseEndTimestamp && (
        <Box
          padding={noSpace ? "md" : "sm"}
          border
          centerContent
          gap="xs"
          cols={2}
        >
          <Text header="small">
            {phase === GamePhase.GUESS
              ? "Approximate Guess Deadline"
              : "Approximate Reveal deadline"}
          </Text>
          <Text header="regular" color="primary">
            {phaseEndTimestamp}
          </Text>
        </Box>
      )}
      {phase === GamePhase.GUESS && !!endGameTimestamp && (
        <Box
          padding={noSpace ? "md" : "sm"}
          border
          centerContent
          gap="xs"
          cols={2}
        >
          <Text header="small">Approximate Reveal Deadline</Text>
          <Text header="regular" color="primary">
            {endGameTimestamp}
          </Text>
        </Box>
      )}
    </Grid>
  );
};
