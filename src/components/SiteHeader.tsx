import styled from "styled-components";
import { Box, Grid, Text } from "../ui";
import { useWeb3Context } from "src/hooks/use_web3";
import { useLupiContract } from "src/hooks/use_lupi_contract";

export const SiteHeader = () => {
  const { accounts, chainId } = useWeb3Context();
  const { phase } = useLupiContract();
  return (
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
          Phase: {phase}
        </Text>
        <Separator />
        <Text color="text" header="small">
          Chain ID: {chainId}
        </Text>
        <Separator />
        <Text color="text" header="small">
          Account: {accounts}
        </Text>
      </Box>
    </Grid>
  );
};

const Separator = styled.div`
  border-left: 1px solid var(--theme-n3);
  height: var(--bl2);
`;
