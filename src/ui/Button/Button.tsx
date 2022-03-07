import React from "react";
import { Box } from "..";
import { BoxProps } from "../Box/Box";

interface Props extends BoxProps {
  background?: BoxProps["background"];
  children?: React.ReactText | React.ReactNode;
}

export const Button = (props: Props) => (
  <Box
    as="button"
    background={props.background ?? "gradient"}
    borderRadius={"lg"}
    padding
    {...props}
  >
    {props.children}
  </Box>
);
