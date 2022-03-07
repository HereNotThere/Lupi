export type TicketData = ReturnType<typeof generateTicketData>;

export const generateTicketData = (
  roundId: number,
  guess: number,
  salt: Uint8Array
) => ({
  roundId,
  guess,
  salt,
});

export const validateGuess = (value: number, maxGuess: number) => {
  return (
    typeof value === "number" &&
    Math.floor(value) === value &&
    value > 0 &&
    value <= maxGuess
  );
};
