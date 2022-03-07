import { useLupiContract } from "src/hooks/useLupiContract";
import { Box, Grid, Text } from "src/ui";

export const GameStats = () => {
  const { guessHashes, currentBalance, rolloverBalance, phaseDeadline } =
    useLupiContract();
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
          {new Date(
            Date.now() + (phaseDeadline?.toNumber() ?? 0)
          ).toLocaleTimeString()}
        </Text>
        <Text header="regular" color="primary">
          {phaseDeadline?.toString()}
        </Text>
      </Box>
    </Grid>
  );
};
