import { motion } from "framer-motion";
import React, { useCallback } from "react";
import { useResponsive } from "src/hooks/useResponsive";
import styled from "styled-components";
import { Box, Button, Text } from "../ui";
import { ConnectWallet } from "./ConnectWallet";

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

  const { isSmall } = useResponsive();

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

      {isSmall ? (
        <Box grow row justifyContent="end" gap="md" alignItems="center">
          <ConnectWallet textProps={{ color: "muted" }} />
        </Box>
      ) : (
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
          <ConnectWallet textProps={{ header: "small" }} />
        </Box>
      )}
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
