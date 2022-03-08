import { BoxProps } from "src/ui/Box/Box";
import { TextButton, TextButtonProps } from "src/ui/Button/Button";

interface Props extends TextButtonProps {
  background?: BoxProps["background"];
  children?: React.ReactText;
}

const BigButton = (props: Props) => (
  <TextButton
    borderRadius="lg"
    padding="md"
    horizontalPadding="lg"
    size="large"
    {...props}
  >
    {props.children}
  </TextButton>
);

export const BigGreenButton = (props: Props) => (
  <BigButton background="gradient" color="background" {...props} />
);

export const BigGreyButton = (props: Props) => (
  <BigButton background="muted2" {...props} />
);
