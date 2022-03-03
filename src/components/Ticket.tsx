import { Box, Text } from "src/ui";
import { TicketData } from "src/utils/lupiUtils";
import styled from "styled-components";

export const Ticket = (props: { ticketData: TicketData }) => (
  <GradientCard borderRadius="lg" padding="md">
    <InsideCard row borderRadius="lg">
      <LeftContainer gap="sm" border="after" padding="md">
        <RotatedText header="small">0x23535...235k</RotatedText>
      </LeftContainer>
      <Box gap="xs" padding="md" minWidth={185} alignItems="start">
        <Text header="large" align="center">
          Round {props.ticketData.roundId}
        </Text>
        <RoundName header="giant" align="center">
          {props.ticketData.guess}
        </RoundName>
      </Box>
    </InsideCard>
  </GradientCard>
);

const GradientCard = styled(Box)`
  background: radial-gradient(50% 50% at 50% 50%, #70f9f1 0%, #8f00ff 100%);
  border-radius: var(--bl5);
`;

const InsideCard = styled(Box)`
  border: 2px solid;
  border-radius: var(--bl5);
`;

const RotatedText = styled(Text)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-90deg);
`;

const LeftContainer = styled(Box)`
  border-color: currentColor;
  border-width: 2px;
  width: 3em;
  white-space: nowrap;
`;

const RoundName = styled(Text)`
  line-height: 80%;
`;
