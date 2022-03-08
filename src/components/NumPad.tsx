import styled, { css } from "styled-components";
import { BigGreenButton } from "./Buttons";

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
}

export const NumPad = (props: Props) => {
  return (
    <StyledNumPad>
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
        >
          {value === "ENTER" ? "⏎" : value}
        </StyledNumKey>
      ))}
    </StyledNumPad>
  );
};

const StyledNumPad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 120px);
  gap: var(--bl3);
`;

const StyledNumKey = styled(BigGreenButton)<{ value: string | number }>`
  ${({ value }) =>
    value === "ENTER" &&
    css`
      grid-column: 2 / span 2;
      aspect-ratio: auto; ;
    `}
`;
