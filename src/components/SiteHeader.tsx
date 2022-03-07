import { useWeb3Context } from "src/hooks/useWeb3";
import { getShortAddress } from "src/utils/lupiUtils";
import styled from "styled-components";
import { Box, Grid, Text } from "../ui";

export const SiteHeader = () => {
  const { accounts, chainId } = useWeb3Context();

  const shortAccounts = accounts.map(getShortAddress);
  return (
    <Grid columns={2} padding="md" horizontalPadding="lg" border borderRadius>
      <Box>
        <Text color="primary" header="regular">
          LUPI
        </Text>
      </Box>
      <Box row justifyContent="end" alignItems="center" gap="md">
        <Separator />
        <Text color="text" header="small">
          HOW TO PLAY
        </Text>
        <Separator />
        <Text color="text" header="small">
          PAST LUPIS
        </Text>
        <Separator />
        <Text color="muted" header="small" textTransform="uppercase">
          Chain ID: {chainId}
        </Text>
        <Text color="muted" header="small" textTransform="uppercase">
          Account: {shortAccounts}
        </Text>
      </Box>
    </Grid>
  );
};

const Separator = styled.div`
  border-left: 1px solid var(--theme-n3);
  height: var(--bl2);
`;
