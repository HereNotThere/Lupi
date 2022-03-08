import React from "react";
import { Box, Text } from "src/ui";
import { BoxProps } from "src/ui/Box/Box";
import {
  ColorThemeAttrs,
  HeaderAttrs,
  TextTransformAttrs,
} from "src/ui/Text/Text";
import "./Button.scss";

export interface ButtonProps extends BoxProps {
  children?: React.ReactText | React.ReactNode;
}

export const Button = (props: BoxProps) => {
  return (
    <Box
      as="button"
      {...props}
      className={`Button ${props.className ? props.className : ""}`}
    >
      {props.children}
    </Box>
  );
};

export interface TextButtonProps extends ButtonProps {
  color: keyof typeof ColorThemeAttrs;
  size: keyof typeof HeaderAttrs;
  textTransform: keyof typeof TextTransformAttrs;
  children?: React.ReactText;
}

export const TextButton = (props: TextButtonProps) => {
  const { color, size, textTransform } = props;
  return (
    <Button>
      <Text header={size} color={color} textTransform={textTransform}>
        {props.children}
      </Text>
    </Button>
  );
};
