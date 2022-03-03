import { Button, Text } from "src/ui";
import styled, { css } from "styled-components";

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
          value={value}
        >
          <Text header="giant">{value === "ENTER" ? "⏎" : value}</Text>
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

const StyledNumKey = styled(Button)<{ value: string | number }>`
  ${({ value }) =>
    value === "⏎" &&
    css`
      grid-column: 2 / span 2;
      aspect-ratio: auto; ;
    `}
`;
