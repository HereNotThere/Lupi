export type TicketData = ReturnType<typeof generateTicketData>;

export const generateTicketData = (guess: number, roundId: number) => ({
  guess,
  hash: "",
  roundId,
});

export const validateGuess = (value: number, maxGuess: number) => {
  return (
    typeof value === "number" &&
    Math.floor(value) === value &&
    value > 0 &&
    value <= maxGuess
  );
};

export const getShortAddress = (address?: string) => {
  return address && address.length > 16
    ? `${address.slice(0, 5)}..${address.slice(-4)}`
    : address;
};
