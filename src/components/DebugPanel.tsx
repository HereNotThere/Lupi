import { useState } from "react";
import { useTickets } from "src/hooks/useTickets";
import { TicketData } from "src/schema/Ticket";
import { Box, Button, Text } from "src/ui";
import { useLupiContract } from "../hooks/useLupiContract";
import { useWeb3Context } from "../hooks/useWeb3";

const TicketList = (props: { tickets: TicketData[] }) => (
  <ul>
    {props.tickets.map((ticket) => (
      <li key={`${ticket.roundId}${ticket.guess}`}>{ticket.guess}</li>
    ))}
  </ul>
);

export const DebugPanel = () => {
  const [guess, setGuessValue] = useState(0);
  const { addArbitrumRinkebyChain, addArbitrumOneChain, switchEthereumChain } =
    useWeb3Context();

  const { tickets } = useTickets();
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
            onChange={(e) => setGuessValue(Number.parseInt(e.target.value))}
            placeholder="Commit guess"
          />
          <Button onClick={() => commitGuess(guess)}>Commit Guess</Button>
        </Box>

        <Box>
          <Button onClick={() => addArbitrumRinkebyChain()}>
            Add addArbitrumRinkebyChain
          </Button>
        </Box>

        <Box>
          <Button onClick={() => addArbitrumOneChain()}>
            Add addArbitrumOneChain
          </Button>
        </Box>

        <Box>
          <Button onClick={() => switchEthereumChain("0xa4b1")}>
            Switch to Arbirum
          </Button>
        </Box>
        <Box>
          <Button onClick={() => switchEthereumChain("0x66EEB")}>
            Switch to Arbirum Rinkeby
          </Button>
        </Box>

        <Box>
          <Button onClick={() => switchEthereumChain("0x4")}>
            Switch to Rinkeby
          </Button>
        </Box>

        <Box padding border centerContent>
          <TicketList tickets={tickets} />
        </Box>

        <Box padding border centerContent>
          <Button onClick={callEndGame}>End Game</Button>
        </Box>
      </Box>

      {/* right container */}
      <Box gap="lg" padding grow>
        <Box padding border centerContent>
          <Box>Finished Games: {JSON.stringify(finishedGames)}</Box>
        </Box>

        <Box padding border centerContent>
          <Box>Revealed Guesses: {revealedGuesses}</Box>
        </Box>
      </Box>
    </Box>
  );
};
