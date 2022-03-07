import { useMemo } from "react";
import { useLupiContract } from "src/hooks/use_lupi_contract";
import { Box, Grid, Text } from "src/ui";

export const RoundStats = () => {
  const { guessHashes, currentBalance, rolloverBalance, phaseDeadline } =
    useLupiContract();
  const phaseEndTimestamp = useMemo(
    () =>
      phaseDeadline?.toNumber()
        ? new Date(phaseDeadline.toNumber() * 1000).toISOString()
        : "NaN",
    [phaseDeadline]
  );
  return (
    <Grid columns={2} gap="sm" alignContent="center" alignItems="center">
      <Box padding="sm" border centerContent gap="xs">
        <Text header="small">Current Jackpot</Text>
        <Text header="regular" color="primary">
          {currentBalance?.add(rolloverBalance ?? 0).toString()} eth
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
    </Grid>
  );
};
