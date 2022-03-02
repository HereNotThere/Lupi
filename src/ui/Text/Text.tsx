import React, { useMemo } from 'react'
import './Text.scss'

const ColorThemeAttrs = {
  text: 'text',
  background: 'background',
  primary: 'primary',
  secondary: 'secondary',
  muted: 'muted',
}

type ColorTheme = keyof typeof ColorThemeAttrs

const HeaderAttrs = {
  giant: 1,
  xlarge: 2,
  large: 3,
  regular: 4,
  small: 5,
}

type Header = keyof typeof HeaderAttrs

interface BaseProps {
  children?: React.ReactNode
  color?: ColorTheme
}

interface Props extends BaseProps {
  header?: Header
}

interface Props extends BaseProps {
  paragraph?: true
  small?: true
}

interface Props extends BaseProps {
  span?: true
  small?: true
}

export const Text = (props: Props) => {
  const { header, paragraph, span, small, color, children, ...otherProps } =
    props

  const className = useMemo(() => {
    const classList: string[] = []

    if (color) {
      classList.push(`color-${props.color}`)
    }
    if (small) {
      classList.push(`small`)
    }

    const className = classList
      .map((c) => `Text--${c}`)
      .filter(Boolean)
      .join(' ')

    return ['Text', className].filter(Boolean).join(' ')
  }, [color, props.color, small])

  switch (true) {
    default:
    case !header && !span: {
      return <p className={className}>{children}</p>
    }
    case header === 'giant': {
      return <h1 className={className}>{children}</h1>
    }
    case header === 'xlarge': {
      return <h2 className={className}>{children}</h2>
    }
    case header === 'large': {
      return <h3 className={className}>{children}</h3>
    }
    case header === 'regular': {
      return <h4 className={className}>{children}</h4>
    }
    case header === 'small': {
      return <h5 className={className}>{children}</h5>
    }
    case span === true: {
      return <span className={className}>{children}</span>
    }
  }
}
