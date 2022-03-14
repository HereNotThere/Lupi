import { useResponsive } from "src/hooks/useResponsive";
import { Grid } from "src/ui";
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
  const { isSmall } = useResponsive();
  return (
    <Grid
      columns={isSmall ? 4 : 3}
      gap={isSmall ? "md" : "md"}
      width={isSmall ? "100%" : undefined}
    >
      {keys.map((value) => (
        <StyledNumKey
          onClick={() => {
            props.onKeyPadPress(value);
          }}
          key={value}
          aspectRatio="square"
          centerContent
          padding={isSmall ? undefined : "xs"}
          horizontalPadding={isSmall ? undefined : "xs"}
          size={isSmall ? "giant" : "giant"}
          value={value}
          icon={value === "ENTER" && <EnterIcon />}
          disabled={value === "ENTER" && !props.canSubmit}
          height={isSmall ? undefined : 100}
          borderRadius={isSmall ? "sm" : "md"}
        >
          {value === "ENTER" ? "" : value}
        </StyledNumKey>
      ))}
    </Grid>
  );
};

const StyledNumKey = styled(BigGreenButton)<{
  value: string | number;
}>`
  color: var(--theme-bg);
  ${({ value }) =>
    value === "ENTER" &&
    css`
      grid-column: span 2;
      aspect-ratio: auto;
    `}
`;
