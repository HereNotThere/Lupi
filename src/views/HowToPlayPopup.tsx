import { motion } from "framer-motion";
import { CloseIcon } from "src/components/Icons";
import { useResponsive } from "src/hooks/useResponsive";
import { Box, Button, Text } from "src/ui";
import styled from "styled-components";

const backgroundVariants = {
  hide: {
    backgroundColor: `rgba(0, 0, 0, 0.0)`,
  },
  show: {
    backgroundColor: `rgba(0, 0, 0, 0.8)`,
  },
};

const popupVariants = {
  hide: {
    scale: 0.9,
    opacity: 0,
  },
  show: {
    scale: 1,
    opacity: 1,
  },
};

const animateProps = {
  initial: "hide",
  animate: "show",
  exit: "hide",
};

export const HowToPlayView = (props: { onClose?: () => void }) => {
  const { isSmall } = useResponsive();
  return (
    <FixedContainer
      centerContent
      onClick={props.onClose}
      variants={backgroundVariants}
      {...animateProps}
      transition={{ duration: 0.4 }}
      style={{ zIndex: 100 }}
      padding="md"
    >
      <MotionBox
        maxWidth={650}
        background="muted"
        padding={isSmall ? "lg" : "xl"}
        borderRadius="sm"
        gap="md"
        {...animateProps}
        variants={popupVariants}
        transition={{ scale: { duration: 0.4 } }}
      >
        <CloseButton background="none" color="text" border={false}>
          <CloseIcon />
        </CloseButton>
        <Text header="regular">Guess the LUPI</Text>
        <Text>
          The winner is the person who guesses the number that is the:
        </Text>
        <Text>
          Lowest:{" "}
          <Text span color="muted">
            The lowest guess that also fulfills the other requirements
          </Text>
        </Text>
        <Text>
          Unique:{" "}
          <Text span color="muted">
            Others must not have also guessed your number
          </Text>
        </Text>
        <Text>
          Positive:{" "}
          <Text span color="muted">
            Must be positive, not negative{" "}
          </Text>
        </Text>
        <Text>
          Integer:{" "}
          <Text span color="muted">
            Must be a whole number (ie 1, 3, 5){" "}
          </Text>
        </Text>
        <Text>
          Make sure to save your entry ticket after your submission in case you
          change browsers or we lose your guess.{" "}
        </Text>
        <Text>
          Entry fee is 0.01 ETH + gas. 100% of the entry fee goes to the
          jackpot.
        </Text>
        <Text>
          After the guessing period is over, there will be a ticket checking
          period. The person who is the LUPI once the ticket checking period is
          over will receive the jackpot directly to their wallet.
        </Text>
      </MotionBox>
    </FixedContainer>
  );
};

const MotionBox = motion(Box);

const FixedContainer = styled(MotionBox)`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;

const CloseButton = styled(Button)`
  position: absolute;
  top: var(--bl2);
  right: var(--bl2);
`;
