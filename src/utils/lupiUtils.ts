export type TicketData = ReturnType<typeof generateTicketData>;

export const generateTicketData = (guess: number, roundId: string) => ({
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
