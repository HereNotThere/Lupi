import { useCallback, useEffect, useMemo, useState } from "react";
import { BigGreenButton, BigGreyButton } from "src/components/Buttons";
import { EthText } from "src/components/EthText";
import { FadeBox } from "src/components/FadeBox";
import { GameStats } from "src/components/GameStats";
import { NumBox } from "src/components/NumBox";
import { NumPad } from "src/components/NumPad";
import { Spinner } from "src/components/Spinner";
import { Ticket } from "src/components/Ticket";
import { TicketStack } from "src/components/TicketStack";
import { useLupiContractContext } from "src/hooks/useLupiContract";
import { useResponsive } from "src/hooks/useResponsive";
import { useTicketList, useTickets } from "src/hooks/useTickets";
import { TicketData } from "src/schema/Ticket";
import { Box, Text } from "src/ui";
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
  const { isSmall } = useResponsive();
  const { onPreviewGuess } = props;
  const { round, guessHashes } = useLupiContractContext();
  const tickets = useTicketList(guessHashes);

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
    <Box row={!isSmall} grow reverse={isSmall} gap={isSmall ? "lg" : false}>
      {/* left column */}
      <Box centerContent grow gap="md">
        <FadeBox>
          {!isSmall && (
            <>
              <Text header="regular" align="center">
                Round {round}
              </Text>
              <NumBox value={inputValue} cols={1} onReset={onResetGuess} />
            </>
          )}
        </FadeBox>
        <FadeBox width={isSmall ? "100%" : undefined}>
          <GameStats />
        </FadeBox>
        {!!tickets.length && (
          <FadeBox>
            <Box verticalPadding="md">
              <Text header="regular" align="center">
                Your tickets
              </Text>
              <TicketStack tickets={tickets} />
            </Box>
          </FadeBox>
        )}
      </Box>
      {/* right column */}
      <FadeBox grow centerContent transitionType={"fade"} gap="lg">
        {isSmall && (
          <>
            <Text header="regular" align="center">
              Round {round}
            </Text>
            <NumBox value={inputValue} cols={1} onReset={onResetGuess} />
          </>
        )}

        <NumPad onKeyPadPress={onKeyPadPress} canSubmit={inputValue > 0} />
      </FadeBox>
    </Box>
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
      if (transactionResult.type === "Failed") {
        console.warn(`commitGuess failed`, { result });
      } else if (transactionResult.type === "Completed") {
        onTicketReceived(result.ticket);
      }
    } else {
      console.warn(`commitGuess failed`, { result });
    }
  }, [commitGuess, guess, onTicketReceived, storeTicket]);

  const onSubmitGuess = useCallback(async () => {
    await submitGuess();
  }, [submitGuess]);

  return (
    <FadeBox grow centerContent gap="lg">
      <Ticket ticketData={props.ticketData} />
      <Text singleLine header="regular">
        Entry fee: <EthText span eth={0.01} /> + gas
      </Text>
      <Box gap="md">
        <FadeBox>
          <BigGreenButton
            minWidth={320}
            color={"background"}
            onClick={onSubmitGuess}
            icon={isComitting && <Spinner />}
          >
            {submitText}
          </BigGreenButton>
        </FadeBox>
        <FadeBox>
          <BigGreyButton
            minWidth={320}
            background="muted2"
            onClick={props.onCancelClick}
          >
            Back
          </BigGreyButton>
        </FadeBox>
      </Box>
    </FadeBox>
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
    <FadeBox grow centerContent gap="lg" transitionType="fade">
      <TicketStack tickets={allSubmittedTickets} />
      <Box alignItems="center">
        <Text header="large">Your entry was submitted!</Text>
        <Text color="muted" align="center">
          Your ticket has been stored in your browser local storage. <br />
          If you'd like to to reveal from another browser, please download it:
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
        <Text header="large" align="center">
          Come back with your ticket to see if you will win
        </Text>
        <Text header="xlarge" align="center">
          {getHumanDate(revealDate)}
        </Text>
      </Box>
    </FadeBox>
  );
};
