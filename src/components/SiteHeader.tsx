import styled from "styled-components";
import { Box, Grid, Text } from "../ui";

export const SiteHeader = () => (
  <Grid columns={2} padding="md" horizontalPadding="lg" border borderRadius>
    <Box>
      <Text color="primary" header="regular">
        LUPI
      </Text>
    </Box>
    <Box row justifyContent="end" alignItems="center" gap="md">
      <Text color="text" header="small">
        HOW TO PLAY
      </Text>
      <Separator />
      <Text color="text" header="small">
        PAST LUPIS
      </Text>
      <Separator />
      <Text color="text" header="small">
        CONNECT WALLET
      </Text>
    </Box>
  </Grid>
);

const Separator = styled.div`
  border-left: 1px solid var(--theme-n3);
  height: var(--bl2);
`;
