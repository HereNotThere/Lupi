import { motion } from "framer-motion";
import React, { ComponentProps } from "react";
import { BoxProps } from "src/ui/Box/Box";
import { TextButton } from "src/ui/Button/Button";

type MotionButtonProps = React.ComponentProps<typeof MotionButton>;

type Props = {
  background?: BoxProps["background"];
  children?: React.ReactText | React.ReactNode;
} & ComponentProps<typeof MotionButton>;

const BigButton = (props: Props & MotionButtonProps) => {
  const { children, ...buttonProps } = props;
  return (
    <MotionButton
      borderRadius="lg"
      padding="md"
      horizontalPadding="lg"
      centerContent
      size="large"
      {...buttonProps}
    >
      {children}
    </MotionButton>
  );
};

const buttonVariants = {
  initial: {
    background:
      "radial-gradient(50% 50% at 50% 50%,rgba(209, 249, 112,0) 0%, rgba(143, 255, 0,0) 10%)",
    boxShadow: `0 0 20px 0px rgba(209, 249, 112, 0.05)`,
  },
  animate: {
    background:
      "radial-gradient(50% 50% at 50% 50%,rgba(209, 249, 112,0.9) 0%, rgba(143, 255, 0,0.9) 10%)",
    boxShadow: `0 0 20px 0px rgba(209, 249, 112, 0.4)`,
  },
  disabled: {
    background:
      "radial-gradient(50% 50% at 50% 50%,rgba(209, 249, 112,0.1) 0%, rgba(143, 255, 0,0.1) 10%)",
  },
  hover: {
    scale: 1.02,
    background:
      "radial-gradient(50% 50% at 50% 50%, rgba(209, 249, 112,100 ) 0%, rgba(143, 255, 0,100 ) 100%)",
    boxShadow: `0 0 20px 0px rgba(209, 249, 112, 0.4)`,
  },
};

export const BigGreenButton = (props: Props) => {
  const { children, ...buttonProps } = props;
  return (
    <BigButton
      color="background"
      whileTap="hover"
      whileHover={props.disabled ? "disabled" : "hover"}
      initial="initial"
      animate={props.disabled ? "disabled" : "animate"}
      variants={buttonVariants}
      {...buttonProps}
    >
      {children}
    </BigButton>
  );
};

export const BigGreyButton = (props: Props) => {
  const { children, ...buttonProps } = props;
  return (
    <BigButton
      background="muted2"
      whileTap="hover"
      whileHover={"hover"}
      initial="normal"
      animate={"normal"}
      variants={{ hover: { scale: 1.02 }, normal: { scale: 1 } }}
      {...buttonProps}
    >
      {children}
    </BigButton>
  );
};
const MotionButton = motion(TextButton);
