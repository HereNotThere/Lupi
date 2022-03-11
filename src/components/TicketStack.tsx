import { TicketData } from "src/schema/Ticket";
import { Box } from "src/ui";
import styled, { css } from "styled-components";
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
      <PlaceholderTicket ticketData={tickets[0]} numTickets={tickets.length} />
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

const PlaceholderTicket = styled(Ticket)<{ numTickets: number }>`
  position: relative;
  display: block;
  visibility: hidden;
  --numTickets: ${({ numTickets }) => numTickets};
  margin-top: calc(var(--numTickets) * var(--bl2));
`;

const StackedTicket = styled(Ticket)<{ order: number }>`
  position: absolute;
  bottom: 0;
  --order: ${({ order }) => order};
  transform: translateY(calc(var(--order) * var(--bl2) * -1))
    scale(calc(1 - var(--order) * 0.05));

  filter: brightness(calc((1) - var(--order) * 0.15));
`;
