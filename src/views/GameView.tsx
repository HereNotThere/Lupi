import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BigButton } from "src/components/Buttons";
import { GameStats } from "src/components/GameStats";
import { NumBox } from "src/components/NumBox";
import { NumPad } from "src/components/NumPad";
import { Ticket } from "src/components/Ticket";
import { GamePhase, useLupiContract } from "src/hooks/useLupiContract";
import { useTickets } from "src/hooks/useTickets";
import { useWeb3Context } from "src/hooks/useWeb3";
import { TicketData } from "src/schema/Ticket";
import { Box, Button, Grid, Text } from "src/ui";
import { saveAs } from "file-saver";
import styled, { css } from "styled-components";

export const GameState = () => {
  const [inputValue, setInputValue] = useState(0);
  const [ticketPreview, setTicketPreview] = useState<TicketData>();
  const {
    commitGuess,
    revealGuess,
    callEndGame,
    phase,
    revealedGuesses,
    round,
    phaseDeadline,
  } = useLupiContract();
  const { tickets, storeTicket } = useTickets();
  const { chainId } = useWeb3Context();

  const revealDate = useMemo(() => {
    if (phaseDeadline) {
      return new Date(phaseDeadline.toNumber() * 1000);
    }
  }, [phaseDeadline]);

  const ticketList = useMemo(
    () => (chainId && round ? tickets[chainId]?.[round] ?? [] : []),
    [chainId, round, tickets]
  );

  const isValidTicket = (t?: TicketData): t is TicketData =>
    !!(t?.roundId && t?.guess && t?.salt);

  const allSubmittedTickets = useMemo(() => {
    return [
      ...ticketList.filter((t) => t.guess !== ticketPreview?.guess),
      ticketPreview,
    ].filter(isValidTicket);
  }, [ticketList, ticketPreview]);

  const submitGuess = useCallback(async () => {
    console.log("submitTicket", inputValue);
    const result = await commitGuess(inputValue);
    console.log(`commitGuess result`, result);
    if (result && chainId && round) {
      storeTicket(chainId, round, result);
      setTicketPreview(result);
    } else {
      console.warn(`commitGuess failed`, { result });
    }
  }, [chainId, commitGuess, inputValue, round, storeTicket]);

  const onSubmitGuess = useCallback(async () => {
    await submitGuess();
  }, [submitGuess]);

  const onPreviewGuess = useCallback(() => {
    if (round && inputValue > 0) {
      setTicketPreview({
        guess: inputValue,
        roundId: round,
        salt: "",
      });
    } else {
      throw new Error("invalid input");
    }
  }, [inputValue, round]);

  const onBackClick = useCallback(() => {
    setTicketPreview(undefined);
    setInputValue(0);
  }, []);

  const onKeyPadPress = useCallback(
    async (char: string) => {
      if (char === "ENTER") {
        onPreviewGuess();
        // await submitGuess();
        return;
      }
      if (char === String(Number.parseInt(char))) {
        setInputValue((v) => (v > 99 ? v : Number.parseInt(`${v}${char}`)));
      }
    },
    [onPreviewGuess]
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

  const onDownloadTicket = useCallback(() => {
    const content = JSON.stringify(allSubmittedTickets);
    const filename = `LUPI Tickets Round#${round}.json`;

    const blob = new Blob([content], {
      type: "application/json;charset=utf-8",
    });

    saveAs(blob, filename);
  }, [allSubmittedTickets, round]);

  switch (phase) {
    case GamePhase.GUESS: {
      if (ticketPreview) {
        return !ticketPreview.salt ? (
          <TicketView
            onCancelClick={onBackClick}
            onSubmitClick={onSubmitGuess}
            ticketData={ticketPreview}
          />
        ) : (
          <SubmittedTicketView
            ticketData={allSubmittedTickets}
            revealDate={revealDate}
            onDownloadClick={onDownloadTicket}
            onBackClick={onBackClick}
          />
        );
      } else {
        return (
          <GuessView inputValue={inputValue} onKeyPadPress={onKeyPadPress} />
        );
      }
    }
    case GamePhase.REVEAL: {
      return <RevealView ticketList={ticketList} />;
    }
    case GamePhase.ENDGAME: {
      return (
        <>
          <Text>
            {"Time to end the game"}
            {JSON.stringify(revealedGuesses)}
          </Text>
          <Button onClick={() => callEndGame()}>{"EndGame"}</Button>
        </>
      );
    }
    default: {
      return <Text>Uknown game state</Text>;
    }
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
      <BigButton
        padding="md"
        horizontalPadding="lg"
        onClick={props.onSubmitClick}
      >
        <Text header="large">Submit Ticket</Text>
      </BigButton>
      <BigButton
        padding="md"
        horizontalPadding="lg"
        background="muted2"
        onClick={props.onCancelClick}
      >
        <Text header="large" color="text">
          Back
        </Text>
      </BigButton>
    </Box>
  );
};

const SubmittedTicketView = (props: {
  ticketData: TicketData[];
  revealDate?: Date;
  onDownloadClick: () => void;
  onBackClick: () => void;
}) => {
  return (
    <Box grow centerContent gap="lg">
      <TicketContainer>
        {props.ticketData.map((t, index) => (
          <PerspectiveContainer index={index}>
            <Ticket ticketData={t} />
          </PerspectiveContainer>
        ))}
      </TicketContainer>
      <Box alignItems="center">
        <Text header="large">Your entry was submitted!</Text>
        <Text color="muted" align="center">
          Your ticket should have automatically downloaded. <br />
          If not, download and keep it safe:
        </Text>
      </Box>
      <Box gap="md">
        <BigButton
          padding="md"
          horizontalPadding="lg"
          onClick={props.onDownloadClick}
        >
          <Text header="large">Download ticket</Text>
        </BigButton>
        <BigButton
          padding="md"
          horizontalPadding="lg"
          background="muted2"
          onClick={props.onBackClick}
        >
          <Text header="large" color="text">
            Submit another
          </Text>
        </BigButton>
      </Box>
      <Box alignItems="center">
        <Text header="large">
          Come back with your ticket to see if you will win
        </Text>
        <Text header="giant">{props.revealDate?.toLocaleTimeString()}</Text>
      </Box>
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

const RevealView = (props: { ticketList: TicketData[] }) => {
  const { ticketList } = props;
  const { round } = useLupiContract();

  return (
    <Grid columns={2} grow>
      {/* left column */}
      <Box centerContent>
        <Grid columns={1} gap="md">
          <Text header="large" align="center">
            Round {round}
          </Text>
          <GameStats />
        </Grid>
      </Box>
      {/* right column */}
      <Box grow centerContent>
        {!ticketList.length ? (
          <Text header="large">No tickets...</Text>
        ) : (
          <>
            <Text header="large">{"Check if you are the LUPI"}</Text>
            <Box row>
              {ticketList.map((ticket) => (
                <Ticket ticketData={ticket} key={ticket.guess} />
              ))}
            </Box>
            <BigButton>
              Check ticket{ticketList.length > 1 ? "s" : ""}
            </BigButton>
          </>
        )}
      </Box>
    </Grid>
  );
};

const TicketContainer = styled(Box)`
  > *:not(:last-child) {
    position: absolute;
  }
`;

const PerspectiveContainer = styled(Box)<{ index: number }>`
  ${({ index }) => css``}
`;
