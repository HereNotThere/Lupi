import { useCallback, useMemo, useState } from "react";
import { useTickets } from "src/hooks/useTickets";
import { TicketData } from "src/schema/Ticket";
import { Box, Button, Text } from "src/ui";
import { Lupi } from "typechain-types";
import { useLupiContractContext } from "../hooks/useLupiContract";
import { useWeb3Context } from "../hooks/useWeb3";

const TicketList = (props: { tickets: TicketData[] }) => (
  <ul>
    {props.tickets.map((ticket) => (
      <li key={`${ticket.roundId}${ticket.guess}${ticket.salt}`}>
        {ticket.guess}
      </li>
    ))}
  </ul>
);

const GuessList = (props: {
  guesses?: Lupi.AllCommitedGuessStructOutput[];
}) => (
  <>
    <Text>Guesses</Text>
    <ul>
      {props.guesses?.map((player) => (
        <li key={`${player.player}`}>
          <ul>
            Player: {player.player}
            {player.commitedGuesses.map((guess, i) => (
              <li key={`${guess.guessHash}`}>
                Guesses: {JSON.stringify(guess)}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  </>
);

export const DebugPanel = () => {
  const [guess, setGuessValue] = useState(0);
  const {
    addArbitrumRinkebyChain,
    addArbitrumOneChain,
    switchEthereumChain,
    chainId,
  } = useWeb3Context();

  const { tickets, storeTicket } = useTickets();

  const {
    guessHashes,
    finishedGames,
    revealedGuesses,
    commitGuess,
    commitGuessState,
    callEndGame,
    round,
  } = useLupiContractContext();

  const ticketList = useMemo(
    () =>
      (chainId && round ? tickets[chainId]?.[round] ?? [] : []).filter(
        (ticket) =>
          guessHashes?.find((guess) =>
            guess.commitedGuesses.find((t) => t.guessHash === ticket.guessHash)
          )
      ),
    [chainId, guessHashes, round, tickets]
  );

  const onClick = useCallback(async () => {
    console.log("submitTicket", guess);
    const result = await commitGuess(guess);
    console.log(`commitGuess result`, result);
    if (result && chainId && round) {
      storeTicket(chainId, round, result);
    } else {
      console.warn(`commitGuess failed`, { result });
    }
  }, [chainId, commitGuess, guess, round, storeTicket]);

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
          <Text>{JSON.stringify(commitGuessState.type)}</Text>
          <Button onClick={onClick}>Commit Guess</Button>
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
          <TicketList tickets={ticketList} />
        </Box>

        <Box padding border centerContent>
          <GuessList guesses={guessHashes} />
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
          <Box>Revealed Guesses: {JSON.stringify(revealedGuesses)}</Box>
        </Box>
      </Box>
    </Box>
  );
};
