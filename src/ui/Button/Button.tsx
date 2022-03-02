import React from "react";
import { Box, Text } from "..";
import { BoxProps } from "../Box/Box";

interface Props extends BoxProps {
  children?: React.ReactText;
}

export const Button = (props: Props) => (
  <Box
    as="button"
    background={"gradient"}
    borderRadius={"lg"}
    padding
    {...props}
  >
    <Text header="large">{props.children}</Text>
  </Box>
);
