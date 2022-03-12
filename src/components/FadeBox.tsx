import { motion, MotionProps } from "framer-motion";
import { Box } from "src/ui";
import { BoxProps } from "src/ui/Box/Box";

const animationProps = {
  initial: "hide",
  animate: "show",
  exit: "hide",
};

const pageVariants = {
  hide: {
    opacity: 0,
  },
  show: {
    opacity: 1,
  },
};

type PageTransitionProps = {
  transitionType?: "normal" | "fast";
};

export const PageTransition = (
  props: PageTransitionProps & BoxProps & MotionProps
) => (
  <motion.div
    {...animationProps}
    variants={pageVariants}
    transition={
      props.transitionType === "fast"
        ? {
            duration: 0.1,
            staggerChildren: 0.002,
            delayChildren: 0.2,
          }
        : {
            duration: 1,
            staggerChildren: 0.05,
            delayChildren: 0.2,
          }
    }
    {...props}
  />
);

const itemBounceVariants = {
  hide: {
    opacity: 0,
    y: 25,
  },
  show: {
    opacity: 1,
    y: 0,
  },
};

const itenFadeVariants = {
  hide: {
    opacity: 0,
  },
  show: {
    opacity: 1,
  },
};

type FadeBoxType = {
  transitionType?: "fade" | "bounce";
};

export const FadeBox = (props: FadeBoxType & BoxProps & MotionProps) => (
  <MotionBox
    variants={
      props.transitionType === "fade" ? itenFadeVariants : itemBounceVariants
    }
    {...props}
    transition={{
      y: {
        type: "spring",
        damping: 20,
        stiffness: 200,
      },
      opacity: {
        duration: 0.2,
      },
    }}
  />
);

const MotionBox = motion(Box);
