import { useCallback, useEffect, useState } from "react";
import produce from "immer";

import { TicketData } from "src/schema/Ticket";

type AllTickets = {
  [chainId: string]: undefined | { [round: number]: undefined | TicketData[] };
};

export const useTickets = () => {
  const [tickets, setTickets] = useState<AllTickets>(() => {
    const saved = localStorage.getItem("tickets");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("tickets", JSON.stringify(tickets));
  }, [tickets]);

  const storeTicket = useCallback(
    (chainId: string, round: number, ticket: TicketData) => {
      setTickets(
        produce((draft) => {
          const chainTickets = draft[chainId];
          if (chainTickets) {
            const roundTickets = chainTickets[round];
            if (roundTickets) {
              roundTickets.push(ticket);
            } else {
              chainTickets[round] = [ticket];
            }
          } else {
            const chainTickets: { [chainId: string]: TicketData[] } = {};
            chainTickets[round] = [ticket];
            draft[chainId] = chainTickets;
          }
        })
      );
    },
    []
  );

  return {
    storeTicket,
    tickets,
  };
};
