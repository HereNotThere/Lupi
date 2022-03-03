import React, { useMemo } from "react";
import "./Text.scss";

const ColorThemeAttrs = {
  text: "text",
  background: "background",
  primary: "primary",
  secondary: "secondary",
  muted: "muted",
};

type ColorTheme = keyof typeof ColorThemeAttrs;

const HeaderAttrs = {
  giant: 1,
  xlarge: 2,
  large: 3,
  regular: 4,
  small: 5,
};

type Header = keyof typeof HeaderAttrs;

const AlignAttrs = {
  center: "center",
  left: "left",
  right: "right",
  justify: "justify",
};

type Align = keyof typeof AlignAttrs;

interface BaseProps {
  children?: React.ReactNode;
  color?: ColorTheme;
  singleLine?: true;
  align?: Align;
}

interface Props extends BaseProps {
  header?: Header;
}

interface Props extends BaseProps {
  paragraph?: true;
  small?: true;
}

interface Props extends BaseProps {
  span?: true;
  small?: true;
}

export const Text = (props: Props) => {
  const { children, color, align, header, singleLine, small, span } = props;

  const className = useMemo(() => {
    const classList: string[] = [];

    if (align) {
      classList.push(`align-${props.align}`);
    }
    if (color) {
      classList.push(`color-${props.color}`);
    }
    if (small) {
      classList.push(`small`);
    }
    if (singleLine) {
      classList.push(`single-line`);
    }

    const className = classList
      .map((c) => `Text--${c}`)
      .filter(Boolean)
      .join(" ");

    return ["Text", className].filter(Boolean).join(" ");
  }, [align, color, props.align, props.color, singleLine, small]);

  switch (true) {
    default:
    case !header && !span: {
      return <p className={className}>{children}</p>;
    }
    case header === "giant": {
      return <h1 className={className}>{children}</h1>;
    }
    case header === "xlarge": {
      return <h2 className={className}>{children}</h2>;
    }
    case header === "large": {
      return <h3 className={className}>{children}</h3>;
    }
    case header === "regular": {
      return <h4 className={className}>{children}</h4>;
    }
    case header === "small": {
      return <h5 className={className}>{children}</h5>;
    }
    case span === true: {
      return <span className={className}>{children}</span>;
    }
  }
};
