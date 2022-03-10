import React, { forwardRef } from "react";
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
  icon?: React.ReactNode;
  disabled?: boolean;
  title?: string;
}

export const Button = forwardRef((props: ButtonProps, ref) => {
  const { children, className, ...boxProps } = props;
  return (
    <Box
      as="button"
      background="none"
      ref={ref}
      className={`Button ${className ? className : ""}`}
      {...boxProps}
    >
      {children}
      {props.icon}
    </Box>
  );
});

export interface TextButtonProps extends ButtonProps {
  color?: keyof typeof ColorThemeAttrs;
  size?: keyof typeof HeaderAttrs;
  textTransform?: keyof typeof TextTransformAttrs;
  children?: React.ReactText;
}

export const TextButton = forwardRef((props: TextButtonProps, ref) => {
  const { children, color, size, textTransform, ...buttonProps } = props;
  return (
    <Button {...buttonProps} ref={ref}>
      {children && (
        <Text header={size} color={color} textTransform={textTransform}>
          {children}
        </Text>
      )}
    </Button>
  );
});
