import React, { useCallback } from "react";
import { useWeb3Context } from "src/hooks/useWeb3";
import { TextButton } from "src/ui/Button/Button";
import { getShortAddress } from "src/utils/lupiUtils";
import styled from "styled-components";
import { Box, Button, Grid, Text } from "../ui";

export type MenuId = "current-game" | "past-games" | "how-to-play";

interface Props {
  onSelectMenuItem: (menuId: string) => void;
}

export const SiteHeader = (props: Props) => {
  const { accounts, chainId, requestAccounts, walletStatus } = useWeb3Context();
  const shortAccounts = accounts.map(getShortAddress);
  return (
    <Grid
      columns={2}
      padding="md"
      horizontalPadding="lg"
      border
      borderRadius="lg"
      minHeight={75}
      alignItems="center"
    >
      <Box>
        <MenuItem
          menuId="current-game"
          onMenuItemClick={props.onSelectMenuItem}
        >
          <Text color="primary" header="regular">
            LUPI
          </Text>
        </MenuItem>
      </Box>

      <Box row justifyContent="end" gap="md">
        <MenuItem
          menuId={"how-to-play"}
          onMenuItemClick={props.onSelectMenuItem}
        >
          <Text color="text" header="small">
            HOW TO PLAY
          </Text>
        </MenuItem>
        <Separator />
        <MenuItem
          menuId={"past-games"}
          onMenuItemClick={props.onSelectMenuItem}
        >
          <Text color="text" header="small">
            PAST LUPIS
          </Text>
        </MenuItem>
        <Separator />
        <Text color="muted" header="small" textTransform="uppercase">
          Chain ID: {chainId}
        </Text>
        <Separator />
        <Text color="muted" header="small" textTransform="uppercase">
          Wallet Status: {walletStatus}
        </Text>
        {accounts.length > 0 ? (
          <Text color="muted" header="small" textTransform="uppercase">
            Account: {shortAccounts}
          </Text>
        ) : (
          <TextButton
            onClick={() => requestAccounts()}
            color="primary"
            size="small"
            textTransform="uppercase"
          >
            Connect Wallet
          </TextButton>
        )}
      </Box>
    </Grid>
  );
};

const MenuItem = (props: {
  menuId: MenuId;
  children?: React.ReactNode;

  onMenuItemClick: (menuItem: string) => void;
}) => {
  const onClick = useCallback(() => {
    props.onMenuItemClick(props.menuId);
  }, [props]);
  return (
    <Button onClick={onClick} background="none">
      {props.children}
    </Button>
  );
};

const Separator = styled.div`
  border-left: 1px solid var(--theme-n3);
  height: var(--bl2);
`;
