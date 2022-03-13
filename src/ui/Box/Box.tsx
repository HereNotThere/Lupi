import React, { CSSProperties, forwardRef, useMemo } from "react";
import "./Box.scss";

const flexPosition = {
  start: "start",
  end: "end",
  center: "center",
  stretch: "stretch",
} as const;

const flexAlign = {
  ...flexPosition,
  spaceAround: "space-around",
  spaceBetween: "space-around",
} as const;

const Sizes = {
  xs: "05",
  sm: "1",
  md: "2",
  lg: "4",
  xl: "6",
} as const;

const BorderRadius = {
  xs: "1",
  sm: "2",
  md: "3",
  lg: "4",
  "100": "100",
};

const Backgrounds = {
  none: "transparent",
  gradient: "gradient",
  muted: "muted",
  muted2: "muted2",
} as const;

const AspectRatios = {
  square: "square",
} as const;

const Borders = {
  none: false,
  after: "after",
  before: "before",
  around: "around",
} as const;

const ColorTheme = {
  text: "text",
  background: "background",
  primary: "primary",
  secondary: "secondary",
  muted: "muted",
} as const;

type FlexPosition = keyof typeof flexPosition;
type FlexAlign = keyof typeof flexAlign;
type SizeAttr = keyof typeof Sizes;
type BorderAttr = keyof typeof Borders;
type BackgroundAttr = keyof typeof Backgrounds;
type AspectRatioAttr = keyof typeof AspectRatios;
type BorderRadiusAttr = keyof typeof BorderRadius;
type ColorThemeAttrs = keyof typeof ColorTheme;

interface BaseProps {
  // react props
  children?: React.ReactNode;
  className?: string;
  style?: CSSProperties;

  // flex container
  row?: boolean;
  reverse?: boolean;

  justifyContent?: FlexPosition;
  alignContent?: FlexAlign;
  alignItems?: FlexPosition;
  alignSelf?: FlexPosition;

  // size & overflow
  overflow?: "scroll" | "hidden";

  width?: number | string;
  height?: number | string;

  minWidth?: number | string;
  maxWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;

  centerContent?: boolean;

  // spacing
  padding?: SizeAttr | true;
  horizontalPadding?: SizeAttr;
  verticalPadding?: SizeAttr;
  gap?: SizeAttr | false;

  // decoration
  color?: ColorThemeAttrs;
  border?: BorderAttr | boolean;
  borderRadius?: BorderRadiusAttr | boolean;
  background?: BackgroundAttr;
  aspectRatio?: AspectRatioAttr;
  fillSpace?: boolean;

  onClick?: () => void;

  as?: keyof HTMLElementTagNameMap;
}

/**
 * Flex content props
 */
interface Props extends BaseProps {
  // flex content
  basis?: number | string;
  grow?: boolean | number;
  shrink?: boolean | number;
}

/**
 * Grid content props
 */
interface Props extends BaseProps {
  cols?: number;
}

export type BoxProps = Props;

export const Box = forwardRef((props: Props, ref) => {
  const className = useMemo(() => {
    const classList = [];

    if (props.row) {
      classList.push("row");
      if (props.reverse) {
        classList.push("row-reverse");
      }
    } else {
      classList.push("column");
      if (props.reverse) {
        classList.push("column-reverse");
      }
    }

    if (props.cols) {
      classList.push(`cols-${props.cols}`);
    }

    if (props.fillSpace) {
      classList.push("fill-space");
    }

    if (props.grow) {
      if (props.grow === true) {
        classList.push("grow");
      }
    }

    if (props.shrink) {
      if (props.shrink === true) {
        classList.push("shrink");
      }
    }

    if (props.justifyContent) {
      classList.push(`justify-content-${props.justifyContent}`);
    }
    if (props.alignContent) {
      classList.push(`align-content-${props.alignContent}`);
    }
    if (props.alignItems) {
      classList.push(`align-items-${props.alignItems}`);
    }
    if (props.alignSelf) {
      classList.push(`align-self-${props.alignSelf}`);
    }
    if (props.centerContent) {
      classList.push(`center-content`);
    }

    if (props.overflow) {
      classList.push(`overflow-${props.overflow}`);
    }

    const border = props.border
      ? props.border === true
        ? "around"
        : props.border
      : null;

    if (border) {
      classList.push(`border`, `border-${border}`);
    }

    const padding = props.padding === true ? "sm" : props.padding;

    if (padding) {
      classList.push(`padding`, `padding-${Sizes[padding]}`);
    }

    if (props.horizontalPadding) {
      classList.push(`padding`, `h-padding-${Sizes[props.horizontalPadding]}`);
    }
    if (props.verticalPadding) {
      classList.push(`padding`, `v-padding-${Sizes[props.verticalPadding]}`);
    }

    const itemsSpace =
      props.gap !== false
        ? typeof props.gap === "undefined"
          ? "sm"
          : props.gap
        : false;

    if (itemsSpace) {
      classList.push(`gap-${Sizes[itemsSpace]}`);
    }

    const borderRadius =
      props.borderRadius === true ? "lg" : props.borderRadius;

    if (borderRadius) {
      classList.push(`border-radius-${BorderRadius[borderRadius]}`);
    }

    if (props.background) {
      classList.push(`background-${Backgrounds[props.background]}`);
    }

    if (props.aspectRatio) {
      classList.push(`aspect-ratio-${AspectRatios[props.aspectRatio]}`);
    }

    if (props.color) {
      classList.push(`color-${props.color}`);
    }

    const className = classList
      .map((c) => `Box--${c}`)
      .filter(Boolean)
      .join(" ");

    return ["Box", className, props.className].filter(Boolean).join(" ");
  }, [
    props.row,
    props.cols,
    props.fillSpace,
    props.grow,
    props.shrink,
    props.justifyContent,
    props.alignContent,
    props.alignItems,
    props.alignSelf,
    props.centerContent,
    props.overflow,
    props.border,
    props.padding,
    props.horizontalPadding,
    props.verticalPadding,
    props.gap,
    props.borderRadius,
    props.background,
    props.aspectRatio,
    props.color,
    props.className,
  ]);

  const {
    basis,
    grow,
    height,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    shrink,
    width,
    style: parentStyle,
  } = props;

  const style = useMemo(() => {
    const style: CSSProperties = parentStyle ? { ...parentStyle } : {};

    if (basis) {
      style.flexBasis = basis;
    }
    if (width) {
      style.width = width;
    }
    if (height) {
      style.height = height;
    }
    if (minWidth) {
      style.minWidth = minWidth;
    }
    if (maxWidth) {
      style.maxWidth = maxWidth;
    }
    if (minHeight) {
      style.minHeight = minHeight;
    }
    if (maxHeight) {
      style.maxHeight = maxHeight;
    }
    if (typeof grow === "number") {
      style.flexGrow = grow;
    }
    if (typeof shrink === "number") {
      style.flexShrink = shrink;
    }
    return style;
  }, [
    basis,
    grow,
    height,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    parentStyle,
    shrink,
    width,
  ]);

  const as = props.as ?? "div";

  return React.createElement(
    as,
    {
      className,
      style,
      onClick: props.onClick,
      ref,
    },
    props.children
  );
});

Box.displayName = "Box";
