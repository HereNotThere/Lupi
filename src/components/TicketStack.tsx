import { TicketData } from "src/schema/Ticket";
import { Box } from "src/ui";
import styled from "styled-components";
import { Ticket } from "./Ticket";

interface Props {
  tickets: TicketData[];
}
export const TicketStack = (props: Props) => {
  const { tickets } = props;
  if (!tickets?.length) {
    return <></>;
  }
  return (
    <Box>
      <PlaceholderTicket ticketData={tickets[0]} />
      {tickets.map((ticket, index, arr) => (
        <StackedTicket
          ticketData={ticket}
          key={ticket.guess}
          order={arr.length - index}
        />
      ))}
    </Box>
  );
};

const PlaceholderTicket = styled(Ticket)`
  visibility: hidden;
`;

const StackedTicket = styled(Ticket)<{ order: number }>`
  position: absolute;
  --order: ${({ order }) => order};
  transform: translateY(calc(var(--order) * -10%))
    scale(calc(1 - var(--order) * 0.05));

  filter: brightness(calc((1) - var(--order) * 0.15));
`;
