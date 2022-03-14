import { forwardRef } from "react";
import { TicketData } from "src/schema/Ticket";
import { Box, Text } from "src/ui";
import { getFormattedTicketNumber, getShortAddress } from "src/utils/lupiUtils";
import styled from "styled-components";

export const Ticket = forwardRef(
  (props: { ticketData: TicketData; className?: string }, ref) => (
    <GradientCard
      borderRadius="lg"
      padding="md"
      className={props.className}
      ref={ref}
    >
      <InsideCard row borderRadius="lg" gap={false}>
        <LeftContainer gap="sm" border="after" padding="md">
          <RotatedText header="small">
            {getShortAddress(props.ticketData.salt || "0x00000000")}
          </RotatedText>
        </LeftContainer>
        <Box
          gap="xs"
          padding="md"
          minWidth={185}
          alignItems="start"
          centerContent
        >
          <Text header="large" align="center">
            Round {props.ticketData.roundId}
          </Text>
          <RoundName header="giant" align="center">
            {getFormattedTicketNumber(props.ticketData.guess)}
          </RoundName>
        </Box>
      </InsideCard>
    </GradientCard>
  )
);

const GradientCard = styled(Box)`
  background: radial-gradient(50% 50% at 50% 50%, #70f9f1 0%, #8f00ff 100%);
  border-radius: var(--bl5);
  user-select: none;
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
