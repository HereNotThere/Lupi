import { useCallback, useEffect, useMemo, useState } from "react";
import { GameStats } from "src/components/GameStats";
import { NumBox } from "src/components/NumBox";
import { NumPad } from "src/components/NumPad";
import { Ticket } from "src/components/Ticket";
import { useLupiContract, GamePhase } from "src/hooks/useLupiContract";
import { useTickets } from "src/hooks/useTickets";
import { useWeb3Context } from "src/hooks/useWeb3";
import { TicketData, validateGuess } from "src/schema/Ticket";
import { Box, Button, Grid, Text } from "src/ui";

export const PlayState = () => {
  const [inputValue, setInputValue] = useState(0);
  const {
    commitGuess,
    revealGuess,
    callEndGame,
    phase,
    revealedGuesses,
    round,
  } = useLupiContract();
  const { tickets, storeTicket } = useTickets();
  const { chainId } = useWeb3Context();

  const ticketList = useMemo(
    () => (chainId && round ? tickets[chainId]?.[round] ?? [] : []),
    [chainId, round, tickets]
  );
  const submitGuess = useCallback(async () => {
    console.log("submitTicket", inputValue);
    const result = await commitGuess(inputValue);
    console.log(`commitGuess result`, result);
    if (result && chainId && round) {
      storeTicket(chainId, round, result);
    } else {
      console.warn(`commitGuess failed`, { result });
    }
  }, [chainId, commitGuess, inputValue, round, storeTicket]);

  const onKeyPadPress = useCallback(
    async (char: string) => {
      if (char === "ENTER") {
        await submitGuess();
        return;
      }
      if (char === String(Number.parseInt(char))) {
        setInputValue((v) => (v > 99 ? v : Number.parseInt(`${v}${char}`)));
      }
    },
    [submitGuess]
  );

  useEffect(() => {
    const onKeyUp = async (e: KeyboardEvent) => {
      const { key } = e;
      if (key.match(/[0-9]/)) {
        await onKeyPadPress(key);
      }
      if (key === "Backspace") {
        setInputValue((v) => parseInt(v.toString().slice(0, -1)) || 0);
      }
      if (key === "Enter") {
        await submitGuess();
      }
    };

    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyPadPress, submitGuess]);

  const onCancelClick = useCallback(() => {
    setInputValue(0);
  }, []);

  const onRevealClick = useCallback(
    async (ticket: TicketData) => await revealGuess(ticket),
    [revealGuess]
  );

  switch (phase) {
    case GamePhase.GUESS:
      return (
        <GuessView inputValue={inputValue} onKeyPadPress={onKeyPadPress} />
      );
    case GamePhase.REVEAL:
      return (
        <>
          <Text>{"Time to redeem tickets"}</Text>
          <ul>
            {ticketList.map((ticket) => (
              <TicketView
                key={`${ticket.roundId}${ticket.guess}`}
                ticketData={ticket}
                onSubmitClick={() => onRevealClick(ticket)}
                onCancelClick={onCancelClick}
              />
            ))}
          </ul>
        </>
      );
    case GamePhase.ENDGAME:
      return (
        <>
          <Text>
            {"Time to end the game"}
            {JSON.stringify(revealedGuesses)}
          </Text>
          <Button onClick={() => callEndGame()}>{"EndGame"}</Button>
        </>
      );
    default:
      return <Text>Uknown game state</Text>;
  }
};

const TicketView = (props: {
  ticketData: TicketData;
  onSubmitClick: () => void;
  onCancelClick: () => void;
}) => {
  return (
    <Box grow centerContent gap="md">
      <Ticket ticketData={props.ticketData} />
      <Text>Entry fee: 0.01ETH + gas</Text>
      <Button padding="md" horizontalPadding="lg" onClick={props.onSubmitClick}>
        <Text header="large">Submit Ticket</Text>
      </Button>
      <Button
        padding="md"
        horizontalPadding="lg"
        background="muted2"
        onClick={props.onCancelClick}
      >
        <Text header="large" color="text">
          Back
        </Text>
      </Button>
    </Box>
  );
};

const GuessView = (props: {
  inputValue: number;
  onKeyPadPress: (value: string) => void;
}) => (
  <Grid columns={2} grow>
    {/* left column */}
    <Box centerContent>
      <RoundPanel inputValue={props.inputValue} />
    </Box>
    {/* right column */}
    <Box grow centerContent>
      <NumPad onKeyPadPress={props.onKeyPadPress} />
    </Box>
  </Grid>
);

const RoundPanel = ({ inputValue }: { inputValue: number }) => {
  const { round } = useLupiContract();

  return (
    <Grid columns={1} gap="md">
      <Text header="regular" align="center">
        Round {round}
      </Text>
      <NumBox value={inputValue} cols={1} />
      <GameStats />
    </Grid>
  );
};
