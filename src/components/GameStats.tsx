import { useMemo } from "react";
import { GamePhase, useLupiContractContext } from "src/hooks/useLupiContract";
import { Box, Grid, Text } from "src/ui";
import { Lupi } from "typechain-types";

import { getEthFromWei, getHumanDate } from "src/utils/lupiUtils";
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

  const wei = currentBalance?.add(rolloverBalance ?? 0);
  const eth = getEthFromWei(wei);

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
        <Text header="regular" color="primary">
          {eth} eth
        </Text>
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
            {phase === GamePhase.GUESS ? "Guess deadline" : "Reveal deadline"}
          </Text>
          <Text header="regular" color="primary">
            {phaseEndTimestamp}
          </Text>
        </Box>
      )}
    </Grid>
  );
};
