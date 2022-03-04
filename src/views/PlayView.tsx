import { useCallback, useEffect, useState } from "react";
import { GameStats } from "src/components/GameStats";
import { NumBox } from "src/components/NumBox";
import { NumPad } from "src/components/NumPad";
import { Ticket } from "src/components/Ticket";
import { useGameData } from "src/hooks/useGameData";
import { GameData, isValidGameData } from "src/hooks/useWeb3Context";
import { Box, Button, Grid, Text } from "src/ui";
import {
  generateTicketData,
  TicketData,
  validateGuess,
} from "src/utils/lupiUtils";

export const PlayState = () => {
  const { game } = useGameData();
  const [inputValue, setInputValue] = useState(0);
  const [ticketData, setTicketData] = useState<TicketData>();

  const validate = useCallback(() => {
    if (isValidGameData(game) && validateGuess(inputValue, game.maxGuess)) {
      const ticketData = generateTicketData(inputValue, game?.roundId);
      setTicketData(ticketData);
    }
  }, [inputValue, game]);

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

  if (!game) {
    return <>INVALID GAME</>;
  }

  return !ticketData ? (
    <PlayView
      inputValue={inputValue}
      onKeyPadPress={onKeyPadPress}
      game={game}
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
  game: GameData;
}) => (
  <Grid columns={2} grow>
    {/* left column */}
    <Box centerContent>
      <RoundPanel inputValue={props.inputValue} game={props.game} />
    </Box>
    {/* right column */}
    <Box grow centerContent>
      <NumPad onKeyPadPress={props.onKeyPadPress} />
    </Box>
  </Grid>
);

const RoundPanel = (props: { inputValue: number; game: GameData }) => {
  const { game, inputValue } = props;
  return isValidGameData(game) ? (
    <Grid columns={1} gap="md">
      <Text header="regular" align="center">
        Round {game.roundId}
      </Text>
      <NumBox value={inputValue} cols={1} />
      <GameStats
        jackpot={game.currentBalance}
        entries={game.players.length}
        revealDate={game.phaseDeadLine}
      />
    </Grid>
  ) : (
    <></>
  );
};
