import { motion } from "framer-motion";
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
    <MotionBox
      initial={"normal"}
      whileHover={tickets?.length > 1 ? "expand" : "normal"}
      animate={"normal"}
      variants={{}}
    >
      <PlaceholderTicket ticketData={tickets[0]} numTickets={tickets.length} />
      {tickets.map((ticket, index, arr) => {
        const order = arr.length - index - 1;
        const morder = -arr.length * 0.25 + arr.length - index - 1;
        return (
          <StackedTicket
            ticketData={ticket}
            key={ticket.guess}
            order={order}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            variants={{
              normal: {
                y: order * -15,
                scale: 1 - order * 0.015,
              },
              expand: {
                y: morder * -120,
                // x: order * 15,
                rotate: order * 5,
              },
            }}
          />
        );
      })}
    </MotionBox>
  );
};

const PlaceholderTicket = styled(Ticket)<{ numTickets: number }>`
  position: relative;
  display: block;
  visibility: hidden;
  --numTickets: ${({ numTickets }) => numTickets};
  margin-top: calc((var(--numTickets) - 1) * 15px);
`;

const StackedTicket = styled(motion(Ticket))<{ order: number }>`
  z-index: 10;
  position: absolute;
  bottom: 0;
  --order: ${({ order }) => order};
  filter: brightness(calc((1) - var(--order) * 0.15));
`;

const MotionBox = motion(Box);
