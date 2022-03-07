import { useMemo } from "react";
import { useLupiContract } from "src/hooks/useLupiContract";
import { Box, Grid, Text } from "src/ui";
import { ethers } from "ethers";

export const GameStats = () => {
  const { guessHashes, currentBalance, rolloverBalance, phaseDeadline, phase } =
    useLupiContract();
  const phaseEndTimestamp = useMemo(
    () =>
      phaseDeadline?.toNumber()
        ? new Date(phaseDeadline.toNumber() * 1000).toISOString()
        : "NaN",
    [phaseDeadline]
  );

  const wei = currentBalance?.add(rolloverBalance ?? 0);
  const eth = wei && ethers.utils.formatEther(wei);

  return (
    <Grid columns={2} gap="sm" alignContent="center" alignItems="center">
      <Box padding="sm" border centerContent gap="xs">
        <Text header="small">Current Jackpot</Text>
        <Text header="regular" color="primary">
          {eth} eth
        </Text>
      </Box>
      <Box padding="sm" gap="xs" border centerContent>
        <Text header="small"># entries </Text>
        <Text header="regular" color="primary">
          {guessHashes?.length ?? 0}
        </Text>
      </Box>
      <Box padding="sm" border centerContent gap="xs" cols={2}>
        <Text header="small">The LUPI Reveal</Text>
        <Text header="regular" color="primary">
          {"P: " + phaseEndTimestamp}
        </Text>
        <Text header="regular" color="primary">
          {"N: " + new Date().toISOString()}
        </Text>
      </Box>
      <Box padding="sm" border centerContent gap="xs" cols={2}>
        <Text header="small">Phase</Text>
        <Text header="regular" color="primary">
          {phase}
        </Text>
      </Box>
    </Grid>
  );
};
