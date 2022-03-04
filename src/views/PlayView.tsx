import { useCallback, useEffect, useState } from "react";
import { RoundData } from "src/App";
import { NumBox } from "src/components/NumBox";
import { NumPad } from "src/components/NumPad";
import { RoundStats } from "src/components/RoundStats";
import { Ticket } from "src/components/Ticket";
import { Box, Button, Grid, Text } from "src/ui";
import {
  generateTicketData,
  TicketData,
  validateGuess,
} from "src/utils/lupiUtils";

interface Props {
  roundData: RoundData;
}

export const PlayState = (props: Props) => {
  const { roundData } = props;
  const [inputValue, setInputValue] = useState(0);
  const [ticketData, setTicketData] = useState<TicketData>();

  const validate = useCallback(() => {
    if (validateGuess(inputValue, roundData.maxGuess)) {
      const ticketData = generateTicketData(inputValue, roundData.roundId);
      setTicketData(ticketData);
    }
  }, [inputValue, roundData.maxGuess, roundData.roundId]);

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

  return !ticketData ? (
    <PlayView
      inputValue={inputValue}
      onKeyPadPress={onKeyPadPress}
      roundData={roundData}
    />
  ) : (
    <TicketView ticketData={ticketData} />
  );
};

const TicketView = (props: { ticketData: TicketData }) => {
  return (
    <Box grow centerContent gap="md">
      <Ticket ticketData={props.ticketData} />
      <Text>Entry fee: 0.01ETH + gas</Text>
      <Button padding="md" horizontalPadding="lg">
        <Text header="large">Submit Ticket</Text>
      </Button>
      <Button padding="md" horizontalPadding="lg" background="muted2">
        <Text header="large" color="text">
          Back
        </Text>
      </Button>
    </Box>
  );
};

const PlayView = (props: {
  inputValue: number;
  onKeyPadPress: (value: string) => void;
  roundData: RoundData;
}) => (
  <Grid columns={2} grow>
    {/* left column */}
    <Box centerContent>
      <RoundPanel inputValue={props.inputValue} roundData={props.roundData} />
    </Box>
    {/* right column */}
    <Box grow centerContent>
      <NumPad onKeyPadPress={props.onKeyPadPress} />
    </Box>
  </Grid>
);

const RoundPanel = ({
  inputValue,
  roundData,
}: {
  inputValue: number;
  roundData: RoundData;
}) => (
  <Grid columns={1} gap="md">
    <Text header="regular" align="center">
      Round {roundData.roundId}
    </Text>
    <NumBox value={inputValue} cols={1} />
    <RoundStats
      jackpot={roundData.jackpot}
      entries={roundData.entries}
      revealDate={roundData.revealDate}
    />
  </Grid>
);