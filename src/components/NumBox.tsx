import { AnimatePresence, motion } from "framer-motion";
import { useResponsive } from "src/hooks/useResponsive";
import { Box, Button } from "src/ui";
import { BoxProps } from "src/ui/Box/Box";
import { getFormattedTicketNumber } from "src/utils/lupiUtils";
import styled from "styled-components";
import { CloseIcon } from "./Icons";

export const NumBox = (
  props: { value: number; onReset: () => void } & BoxProps
) => {
  const { isSmall } = useResponsive();
  const value = getFormattedTicketNumber(props.value);
  return (
    <StyledNumBox
      border
      borderRadius="lg"
      padding={isSmall ? "sm" : "lg"}
      background="muted"
      aspectRatio={isSmall ? undefined : "square"}
      centerContent
      width={280}
      {...props}
    >
      {value}
      <AnimatePresence>
        {Number.parseInt(value) > 0 && <ResetButton onClick={props.onReset} />}
      </AnimatePresence>
    </StyledNumBox>
  );
};

const StyledNumBox = styled(Box)`
  border: 12px solid var(--color-dark-grey);
  font-size: var(--bl11);
  font-weight: bold;
`;

const ResetButton = (props: { onClick: () => void }) => (
  <StyledCancelButton
    title="RESET"
    borderRadius
    padding
    color="secondary"
    background="muted"
    onClick={props.onClick}
    variants={{
      hide: { scale: 0, opacity: 0 },
      show: { scale: 1, opacity: 1 },
    }}
    initial="hide"
    animate="show"
    exit="hide"
  >
    <CloseIcon />
  </StyledCancelButton>
);

const StyledCancelButton = styled(motion(Button))`
  position: absolute;
  color: var(--theme-p1);
  top: calc(-1 * var(--bl4));
  right: calc(-1 * var(--bl4));
  border: 4px solid var(--theme-n3);
  box-shadow: 0 0 10px 5px rgba(0, 0, 0, 0.2);
`;
