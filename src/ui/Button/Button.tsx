import React from "react";
import { Box } from "..";
import { BoxProps } from "../Box/Box";

interface Props extends BoxProps {
  children?: React.ReactText | React.ReactNode;
}

export const Button = (props: Props) => (
  <Box
    as="button"
    background={"gradient"}
    borderRadius={"lg"}
    padding
    {...props}
  >
    {props.children}
  </Box>
);
