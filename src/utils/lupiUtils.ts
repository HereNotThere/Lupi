import saveAs from "file-saver";
import { TicketData } from "src/schema/Ticket";

export const getShortAddress = (address?: string | undefined) => {
  return address && address.length > 16
    ? `${address.slice(0, 5)}..${address.slice(-4)}`
    : address;
};

export const isValidTicket = (t?: TicketData): t is TicketData =>
  !!(t?.roundId && t?.guess && t?.salt);

export const generatePreviewTicket = (data: {
  round?: number;
  guess: number;
}) => {
  const { round: roundId, guess } = data;
  return roundId && guess > 0
    ? {
        guess,
        roundId,
        salt: "",
        guessHash: "",
      }
    : undefined;
};

export const createTicketDownload = (tickets: TicketData[], round: number) => {
  const content = JSON.stringify(tickets);
  const filename = `LUPI Tickets Round#${round}.json`;

  const blob = new Blob([content], {
    type: "application/json;charset=utf-8",
  });

  saveAs(blob, filename);
};
