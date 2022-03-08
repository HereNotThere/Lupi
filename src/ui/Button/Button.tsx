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
  const { children, className, ...boxProps } = props;
  return (
    <Box
      as="button"
      background="none"
      {...boxProps}
      className={`Button ${className ? className : ""}`}
    >
      {children}
    </Box>
  );
};

export interface TextButtonProps extends ButtonProps {
  color?: keyof typeof ColorThemeAttrs;
  size?: keyof typeof HeaderAttrs;
  textTransform?: keyof typeof TextTransformAttrs;
  children?: React.ReactText;
}

export const TextButton = (props: TextButtonProps) => {
  const { children, color, size, textTransform, ...buttonProps } = props;
  return (
    <Button {...buttonProps}>
      <Text header={size} color={color} textTransform={textTransform}>
        {children}
      </Text>
    </Button>
  );
};
