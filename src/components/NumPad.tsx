import { AnimatePresence } from "framer-motion";
import styled, { css } from "styled-components";
import { BigGreenButton } from "./Buttons";
import { EnterIcon } from "./Icons";

const keys = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "ENTER",
] as const;

interface Props {
  onKeyPadPress: (n: string) => void;
  canSubmit: boolean;
}

export const NumPad = (props: Props) => {
  return (
    <StyledNumPad>
      <AnimatePresence>
        {keys.map((value) => (
          <StyledNumKey
            onClick={() => {
              props.onKeyPadPress(value);
            }}
            key={value}
            aspectRatio="square"
            centerContent
            padding="xs"
            size="giant"
            value={value}
            icon={value === "ENTER" && <EnterIcon />}
            disabled={value === "ENTER" && !props.canSubmit}
          >
            {value === "ENTER" ? "" : value}
          </StyledNumKey>
        ))}
      </AnimatePresence>
    </StyledNumPad>
  );
};

const StyledNumPad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 120px);
  gap: var(--bl3);
`;

const StyledNumKey = styled(BigGreenButton)<{
  value: string | number;
}>`
  color: var(--theme-bg);
  ${({ value }) =>
    value === "ENTER" &&
    css`
      grid-column: 2 / span 2;
      aspect-ratio: auto; ;
    `}
`;
