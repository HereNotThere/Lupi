import React, { CSSProperties, forwardRef, useMemo } from 'react'
import './Box.scss'

const flexPosition = {
  start: 'start',
  end: 'end',
  center: 'center',
} as const

const Sizes = {
  xs: '1',
  sm: '2',
  md: '3',
  lg: '4',
} as const

const BorderRadius = {
  xs: '1',
  sm: '2',
  md: '3',
  lg: '4',
  '100': '100',
}

const Backgrounds = {
  transparent: 'transparent',
  gradient: 'gradient',
  muted: 'muted',
} as const

const AspectRatios = {
  square: 'square',
} as const

const Borders = {
  after: 'after',
  before: 'before',
  around: 'around',
} as const

type FlexPosition = keyof typeof flexPosition
type SizeAttr = keyof typeof Sizes
type BorderAttr = keyof typeof Borders
type BackgroundAttr = keyof typeof Backgrounds
type AspectRatioAttr = keyof typeof AspectRatios
type BorderRadiusAttr = keyof typeof BorderRadius

type Props = {
  children?: React.ReactNode
  basis?: number | string
  grow?: boolean | number
  shrink?: boolean | number
  row?: boolean
  justifyContent?: FlexPosition
  alignContent?: FlexPosition
  alignItems?: FlexPosition
  alignSelf?: FlexPosition
  centerContent?: boolean
  padding?: SizeAttr | true
  itemSpace?: SizeAttr | false
  border?: BorderAttr | boolean
  borderRadius?: BorderRadiusAttr | boolean
  background?: BackgroundAttr
  aspectRatio?: AspectRatioAttr
  fillSpace?: boolean

  minWidth?: number | string
  maxWidth?: number | string
  minHeight?: number | string
  maxHeight?: number | string

  width?: number | string
  height?: number | string

  overflow?: 'scroll' | 'hidden'

  onClick?: () => void

  as?: keyof HTMLElementTagNameMap
}

export type BoxProps = Props

export const Box = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const className = useMemo(() => {
    const classList = []

    if (props.row) {
      classList.push('row')
    } else {
      classList.push('column')
    }

    if (props.fillSpace) {
      classList.push('fill-space')
    }

    if (props.grow) {
      if (props.grow === true) {
        classList.push('grow')
      }
    }

    if (props.shrink) {
      if (props.shrink === true) {
        classList.push('shrink')
      }
    }

    if (props.justifyContent) {
      classList.push(`justify-content-${props.justifyContent}`)
    }
    if (props.alignContent) {
      classList.push(`align-content-${props.alignContent}`)
    }
    if (props.alignItems) {
      classList.push(`align-items-${props.alignItems}`)
    }
    if (props.centerContent) {
      classList.push(`center-content`)
    }

    if (props.overflow) {
      classList.push(`overflow-${props.overflow}`)
    }

    const border = props.border
      ? props.border === true
        ? 'around'
        : props.border
      : null

    if (border) {
      classList.push(`border`, `border-${border}`)
    }

    const padding = props.padding === true ? 'sm' : props.padding

    if (padding) {
      classList.push(`padding`, `padding-${Sizes[padding]}`)
    }

    const itemsSpace =
      props.itemSpace !== false
        ? typeof props.itemSpace === 'undefined'
          ? 'sm'
          : props.itemSpace
        : false

    if (itemsSpace) {
      classList.push(`itemspace-${Sizes[itemsSpace]}`)
    }

    const borderRadius = props.borderRadius === true ? 'lg' : props.borderRadius

    if (borderRadius) {
      classList.push(`border-radius-${BorderRadius[borderRadius]}`)
    }

    if (props.background) {
      classList.push(`background-${Backgrounds[props.background]}`)
    }

    if (props.aspectRatio) {
      classList.push(`aspect-ratio-${AspectRatios[props.aspectRatio]}`)
    }

    const className = classList
      .map((c) => `Box--${c}`)
      .filter(Boolean)
      .join(' ')

    return ['Box', className].filter(Boolean).join(' ')
  }, [
    props.row,
    props.fillSpace,
    props.grow,
    props.shrink,
    props.justifyContent,
    props.alignContent,
    props.alignItems,
    props.centerContent,
    props.overflow,
    props.border,
    props.borderRadius,
    props.background,
    props.aspectRatio,
    props.padding,
    props.itemSpace,
  ])

  const {
    basis,
    width,
    height,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    grow,
    shrink,
  } = props

  const style = useMemo(() => {
    const style: CSSProperties = {}

    if (basis) {
      style.flexBasis = basis
    }
    if (width) {
      style.width = width
    }
    if (height) {
      style.height = height
    }
    if (minWidth) {
      style.minWidth = minWidth
    }
    if (maxWidth) {
      style.maxWidth = maxWidth
    }
    if (minHeight) {
      style.minHeight = minHeight
    }
    if (maxHeight) {
      style.maxHeight = maxHeight
    }
    if (typeof grow === 'number') {
      style.flexGrow = grow
    }
    if (typeof shrink === 'number') {
      style.flexShrink = shrink
    }
    return style
  }, [
    basis,
    width,
    height,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    grow,
    shrink,
  ])

  const as = props.as ?? 'div'

  return React.createElement(as, { className, style, children: props.children })
})
