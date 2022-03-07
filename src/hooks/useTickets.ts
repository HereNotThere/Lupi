import { useEffect, useState } from "react";
import { TicketData } from "src/schema/Ticket";

export const useTickets = () => {
  //localStorage.setItem("name", JSON.stringify(name));

  const [tickets, setTickets] = useState<TicketData[]>(() => {
    // getting stored value
    const saved = localStorage.getItem("tickets");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // storing input name
    localStorage.setItem("tickets", JSON.stringify(tickets));
  }, [tickets]);

  return {
    tickets,
    setTickets,
  };
};
