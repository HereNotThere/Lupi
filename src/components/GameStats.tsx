import { Box, Grid, Text } from "src/ui";

interface Props {
  jackpot: number;
  entries: number;
  revealDate: Date;
}

export const GameStats = (props: Props) => {
  return (
    <Grid columns={2} gap="sm" alignContent="center" alignItems="center">
      <Box padding="sm" border centerContent gap="xs">
        <Text header="small">Current Jackpot</Text>
        <Text header="regular" color="primary">
          2.5eth
        </Text>
      </Box>
      <Box padding="sm" gap="xs" border centerContent>
        <Text header="small"># entries </Text>
        <Text header="regular" color="primary">
          24
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
