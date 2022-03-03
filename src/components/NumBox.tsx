import { Box } from 'src/ui'
import { BoxProps } from 'src/ui/Box/Box'
import styled from 'styled-components'

export const NumBox = (props: { value: number } & BoxProps) => (
  <StyledNumBox
    border
    borderRadius="lg"
    padding="lg"
    background="muted"
    aspectRatio="square"
    centerContent
    {...props}
  >
    {props.value}
  </StyledNumBox>
)

const StyledNumBox = styled(Box)`
  border: 12px solid var(--color-dark-grey);
  font-size: var(--bl11);
  font-weight: bold;
`
