import { motion } from "framer-motion";
import React, { useCallback } from "react";
import { useWeb3Context, WalletStatus } from "src/hooks/useWeb3";
import { TextButton } from "src/ui/Button/Button";
import { getShortAddress } from "src/utils/lupiUtils";
import styled from "styled-components";
import { Box, Button, Text } from "../ui";

export type MenuId = "current-game" | "past-games" | "how-to-play";

interface Props {
  pageId: string;
  onSelectMenuItem: (menuId: string) => void;
}

const headerVariants = {
  hide: {
    opacity: 0,
  },
  show: {
    opacity: 1,
  },
};
const animationProps = {
  initial: "hide",
  animate: "show",
  exit: "hide",
};

export const SiteHeader = (props: Props) => {
  const { pageId } = props;
  const { accounts, requestAccounts, walletStatus } = useWeb3Context();
  const shortAccounts = accounts.map(getShortAddress);

  return (
    <MotionBox
      padding="md"
      horizontalPadding="lg"
      border
      borderRadius="lg"
      minHeight={75}
      alignItems="center"
      row
      variants={headerVariants}
      {...animationProps}
      transition={{
        delay: 0.2,
      }}
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
          selected={pageId === "past-games"}
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
    </MotionBox>
  );
};

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const MenuItem = (props: {
  menuId: MenuId;
  selected?: boolean;
  children?: React.ReactNode;

  onMenuItemClick: (menuItem: string) => void;
}) => {
  const onClick = useCallback(() => {
    props.onMenuItemClick(props.menuId);
  }, [props]);
  return (
    <MotionButton
      onClick={onClick}
      background="none"
      color={props.selected ? "primary" : undefined}
    >
      {props.children}
    </MotionButton>
  );
};

const Separator = styled.div`
  border-left: 1px solid var(--theme-n3);
  height: var(--bl2);
`;
