import { Box, BoxProps } from "src/ui/Box/Box";

interface Props extends BoxProps {
  background?: BoxProps["background"];
  children?: React.ReactText | React.ReactNode;
}

export const BigButton = (props: Props) => (
  <Box
    as="button"
    background={props.background ?? "gradient"}
    borderRadius="lg"
    padding
    {...props}
  >
    {props.children}
  </Box>
);
