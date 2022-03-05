import { useState } from "react";
import { Box, Button, Text } from "src/ui";
import { useLupiContract } from "../hooks/use_lupi_contract";

export const DebugPanel = () => {
  const [guess, setGuessValue] = useState("");
  const [revealedGuess, setRevealedGuessValue] = useState("");

  const {
    finishedGames,
    revealedGuesses,
    commitGuess,
    revealGuess,
    callEndGame,
  } = useLupiContract();

  return (
    <Box row>
      {/* left container */}
      <Box gap="lg" padding grow>
        <Box padding border centerContent>
          <Text header="large">Commit Guess</Text>
          <input
            onChange={(e) => setGuessValue(e.target.value)}
            placeholder="Commit guess"
          />
          <Button onClick={() => commitGuess(guess)}>Commit Guess</Button>
        </Box>

        <Box padding border centerContent>
          <input
            onChange={(e) => setRevealedGuessValue(e.target.value)}
            placeholder="Reveal guess"
          />
          <Button onClick={() => revealGuess(revealedGuess)}>
            Reveal Guess
          </Button>
        </Box>

        <Box padding border centerContent>
          <Button onClick={callEndGame}>End Game</Button>
        </Box>
      </Box>

      {/* right container */}
      <Box gap="lg" padding grow>
        <Box padding border centerContent>
          <Box>Finished Games: {finishedGames}</Box>
        </Box>

        <Box padding border centerContent>
          <Box>Revealed Guesses: {revealedGuesses}</Box>
        </Box>
      </Box>
    </Box>
  );
};
