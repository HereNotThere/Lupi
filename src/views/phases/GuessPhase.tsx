import { useCallback, useEffect, useMemo, useState } from "react";
import { BigGreenButton, BigGreyButton } from "src/components/Buttons";
import { GameStats } from "src/components/GameStats";
import { NumBox } from "src/components/NumBox";
import { NumPad } from "src/components/NumPad";
import { Spinner } from "src/components/Spinner";
import { Ticket } from "src/components/Ticket";
import { TicketStack } from "src/components/TicketStack";
import { useLupiContractContext } from "src/hooks/useLupiContract";
import { useTicketList, useTickets } from "src/hooks/useTickets";
import { TicketData } from "src/schema/Ticket";
import { Box, Grid, Text } from "src/ui";
import {
  createTicketDownload,
  generatePreviewTicket,
  getHumanDate,
  isValidTicket,
} from "src/utils/lupiUtils";

export const GuessPhase = () => {
  const { round } = useLupiContractContext();
  const [ticket, setTicket] = useState<TicketData & { isPreview?: boolean }>();

  const onPreviewGuess = useCallback(
    (guess: number) => {
      const preview = generatePreviewTicket({ round, guess });
      if (preview) {
        setTicket({ ...preview, isPreview: true });
      } else {
        throw new Error("Invalid ticket data");
      }
    },
    [round]
  );
  const onTicketReceived = useCallback((ticket: TicketData) => {
    setTicket(ticket);
  }, []);

  const onBackClick = useCallback(() => {
    setTicket(undefined);
  }, []);

  if (ticket) {
    return ticket.isPreview ? (
      <TicketPreview
        onCancelClick={onBackClick}
        onTicketReceived={onTicketReceived}
        ticketData={ticket}
      />
    ) : (
      <TicketResult ticket={ticket} onBackClick={onBackClick} />
    );
  } else {
    return <GuessView onPreviewGuess={onPreviewGuess} />;
  }
};

const GuessView = (props: { onPreviewGuess: (guess: number) => void }) => {
  const { onPreviewGuess } = props;
  const { round } = useLupiContractContext();
  const [inputValue, setInputValue] = useState(0);

  const onResetGuess = useCallback(() => {
    setInputValue(0);
  }, []);

  const onKeyPadPress = useCallback(
    (char: string) => {
      if (char === "ENTER") {
        onPreviewGuess(inputValue);
      }
      if (char === String(Number.parseInt(char))) {
        setInputValue((v) => (v > 99 ? v : Number.parseInt(`${v}${char}`)));
      }
    },
    [inputValue, onPreviewGuess]
  );

  useEffect(() => {
    const onKeyUp = async (e: KeyboardEvent) => {
      const { key } = e;
      if (key.match(/[0-9]/)) {
        await onKeyPadPress(key);
      }
      if (key === "Backspace" || key === "Escape") {
        setInputValue(0);
      }
      if (key === "Enter") {
        onPreviewGuess(inputValue);
      }
    };

    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [inputValue, onKeyPadPress, onPreviewGuess]);

  return (
    <Grid columns={2} grow>
      {/* left column */}
      <Box centerContent>
        <Grid columns={1} gap="md">
          <Text header="regular" align="center">
            Round {round}
          </Text>
          <NumBox value={inputValue} cols={1} onReset={onResetGuess} />
          <GameStats />
        </Grid>
      </Box>
      {/* right column */}
      <Box grow centerContent>
        <NumPad onKeyPadPress={onKeyPadPress} canSubmit={inputValue > 0} />
      </Box>
    </Grid>
  );
};

const TicketPreview = (props: {
  ticketData: TicketData;
  onTicketReceived: (ticket: TicketData) => void;
  onCancelClick: () => void;
}) => {
  const { ticketData, onTicketReceived } = props;
  const { guess } = ticketData;
  const { commitGuessState, commitGuess } = useLupiContractContext();
  const { storeTicket } = useTickets();

  const isComitting = commitGuessState.type === "Running";
  const submitText = !isComitting ? `Submit Ticket` : ``;

  const submitGuess = useCallback(async () => {
    console.log("submitTicket", guess);

    if (!guess) {
      console.log("submitTicket", "invalid guess");
      return;
    }

    const result = await commitGuess(guess);
    console.log(`commitGuess result`, result);
    if (result) {
      // Store the ticket even while the transaction is running, will merged with guesses later
      // to filter out failed transactions. Allows for the case where the user closes the browser
      // window before a succesful transaction completes
      storeTicket(result.ticket);
      const transactionResult = await result.result;
      onTicketReceived(result.ticket);
      if (transactionResult.type === "Failed") {
        console.warn(`commitGuess failed`, { result });
      }
    } else {
      console.warn(`commitGuess failed`, { result });
    }
  }, [commitGuess, guess, onTicketReceived, storeTicket]);

  const onSubmitGuess = useCallback(async () => {
    await submitGuess();
  }, [submitGuess]);

  return (
    <Box grow centerContent gap="md">
      <Ticket ticketData={props.ticketData} />
      <Text>Entry fee: 0.01ETH + gas</Text>
      <BigGreenButton
        minWidth={320}
        color={"background"}
        onClick={onSubmitGuess}
        icon={isComitting && <Spinner />}
      >
        {submitText}
      </BigGreenButton>
      <BigGreyButton
        minWidth={320}
        background="muted2"
        onClick={props.onCancelClick}
      >
        Back
      </BigGreyButton>
    </Box>
  );
};

const TicketResult = (props: {
  ticket: TicketData;
  onBackClick: () => void;
}) => {
  const { ticket } = props;
  const { round, phaseDeadline } = useLupiContractContext();
  const { guessHashes } = useLupiContractContext();

  const ticketList = useTicketList(guessHashes);

  const allSubmittedTickets = useMemo(() => {
    return [
      ...ticketList
        .filter((t) => t.guess !== ticket?.guess)
        .sort((a, b) => a.guess - b.guess),
      ticket,
    ].filter(isValidTicket);
  }, [ticketList, ticket]);

  const onDownloadTicket = useCallback(() => {
    if (round && allSubmittedTickets?.length) {
      createTicketDownload(allSubmittedTickets, round);
    }
  }, [allSubmittedTickets, round]);

  const revealDate = useMemo(() => {
    if (phaseDeadline) {
      return new Date(phaseDeadline.toNumber() * 1000);
    }
  }, [phaseDeadline]);

  return (
    <Box grow centerContent gap="lg">
      <TicketStack tickets={allSubmittedTickets}></TicketStack>
      <Box alignItems="center">
        <Text header="large">Your entry was submitted!</Text>
        <Text color="muted" align="center">
          Your ticket should have automatically downloaded. <br />
          If not, download and keep it safe:
        </Text>
      </Box>
      <Box gap="md" alignItems="center">
        <BigGreenButton onClick={onDownloadTicket}>
          {`Download ticket${allSubmittedTickets.length > 1 ? "s" : ""}`}
        </BigGreenButton>
        <BigGreyButton onClick={props.onBackClick}>
          Submit another
        </BigGreyButton>
      </Box>
      <Box alignItems="center">
        <Text header="large">
          Come back with your ticket to see if you will win
        </Text>
        <Text header="giant">{getHumanDate(revealDate)}</Text>
      </Box>
    </Box>
  );
};
