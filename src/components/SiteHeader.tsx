import React, { useCallback } from "react";
import { useWeb3Context, WalletStatus } from "src/hooks/useWeb3";
import { TextButton } from "src/ui/Button/Button";
import { getShortAddress } from "src/utils/lupiUtils";
import styled from "styled-components";
import { Box, Button, Text } from "../ui";

export type MenuId = "current-game" | "past-games" | "how-to-play";

interface Props {
  onSelectMenuItem: (menuId: string) => void;
}

export const SiteHeader = (props: Props) => {
  const { accounts, requestAccounts, walletStatus } = useWeb3Context();
  const shortAccounts = accounts.map(getShortAddress);

  return (
    <Box
      padding="md"
      horizontalPadding="lg"
      border
      borderRadius="lg"
      minHeight={75}
      alignItems="center"
      row
    >
      <Box shrink>
        <MenuItem
          menuId="current-game"
          onMenuItemClick={props.onSelectMenuItem}
        >
          <Text color="primary" header="regular">
            LUPI
          </Text>
        </MenuItem>
      </Box>

      <Box grow row justifyContent="end" gap="md">
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
        {/* <Text color="muted" header="small" textTransform="uppercase">
          Chain ID: {chainId}
        </Text>
        <Separator />
        <Text color="muted" header="small" textTransform="uppercase">
          Wallet Status: {walletStatus}
        </Text> */}
        {walletStatus === WalletStatus.Unlocked ? (
          <Text header="small" textTransform="uppercase" color="muted">
            <Text span color="primary">
              {shortAccounts[0]}
            </Text>
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
    </Box>
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
