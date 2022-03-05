import { useLupiContract } from "src/hooks/use_lupi_contract";
import { Box, Grid, Text } from "src/ui";

interface Props {
  jackpot: string;
  entries: number;
  revealDate: Date;
}

export const RoundStats = (props: Props) => {
  const { guessHashes, currentBalance, rolloverBalance } = useLupiContract();
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
          {guessHashes.length}
        </Text>
      </Box>
      <Box padding="sm" border centerContent gap="xs" cols={2}>
        <Text header="small">The LUPI Reveal</Text>
        <Text header="regular" color="primary">
          {new Date().toLocaleDateString()}
        </Text>
      </Box>
    </Grid>
  );
};
