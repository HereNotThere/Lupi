import { useCallback, useEffect, useState } from "react";
import { GameStats } from "src/components/GameStats";
import { NumBox } from "src/components/NumBox";
import { NumPad } from "src/components/NumPad";
import { Ticket } from "src/components/Ticket";
import { useLupiContract } from "src/hooks/useLupiContract";
import { Box, Button, Grid, Text } from "src/ui";
import {
  generateTicketData,
  TicketData,
  validateGuess,
} from "src/utils/lupiUtils";

export const PlayState = () => {
  const [inputValue, setInputValue] = useState(0);
  const [ticketData, setTicketData] = useState<TicketData>();
  const game = useLupiContract();
  const { round, commitGuess } = game;

  const validate = useCallback(() => {
    if (validateGuess(inputValue, 999)) {
      const ticketData = generateTicketData(inputValue, round ?? 0);
      setTicketData(ticketData);
    }
  }, [inputValue, round]);

  const onKeyPadPress = useCallback(
    (char: string) => {
      if (char === "ENTER") {
        validate();
        return;
      }
      if (char === String(Number.parseInt(char))) {
        setInputValue((v) => (v > 99 ? v : Number.parseInt(`${v}${char}`)));
      }
    },
    [validate]
  );

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      const { key } = e;
      if (key.match(/[0-9]/)) {
        onKeyPadPress(key);
      }
      if (key === "Backspace") {
        setInputValue((v) => parseInt(v.toString().slice(0, -1)) || 0);
      }
      if (key === "Enter") {
        validate();
      }
    };

    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyPadPress, validate]);

  const submitTicket = useCallback(async () => {
    console.log(ticketData);
    const result = await commitGuess(String(inputValue));
    console.log({ result });
  }, [commitGuess, inputValue, ticketData]);

  const onSubmitClick = useCallback(() => {
    submitTicket().catch((e) => console.error(e));
  }, [submitTicket]);

  const onCancelClick = useCallback(() => {
    setTicketData(undefined);
  }, []);

  return !ticketData ? (
    <GuessView inputValue={inputValue} onKeyPadPress={onKeyPadPress} />
  ) : (
    <TicketView
      ticketData={ticketData}
      onSubmitClick={onSubmitClick}
      onCancelClick={onCancelClick}
    />
  );
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
