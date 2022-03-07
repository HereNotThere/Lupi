import { useLupiContract } from "src/hooks/useLupiContract";
import { Box, Grid, Text } from "src/ui";
import { getShortAddress } from "src/utils/lupiUtils";
import { GameResultEvent } from "typechain-types/Lupi";

export const PastGames = () => {
  const { finishedGames } = useLupiContract();
  return <GameList games={finishedGames}></GameList>;
};

interface Props {
  games: GameResultEvent[];
}

export const GameList = (props: Props) => {
  return (
    <Box alignItems="center" verticalPadding="lg">
      <Grid columns={5} maxWidth={800} gap="lg">
        <ResultRow
          columns={["Round", "Date", "Pot", "LUPI", "Winner"]}
        ></ResultRow>
        {props.games.map((result, index) => (
          <ResultRow
            key={`${result.args.round}-${index}`}
            columns={[
              result.args.round,
              "?",
              result.args.award.toString(),
              result.args.lowestGuess.toString(),
              getShortAddress(result.args.winner),
            ]}
          ></ResultRow>
        ))}
      </Grid>
    </Box>
  );
};

const ResultRow = (props: {
  columns: [
    string | number | undefined,
    string | number | undefined,
    string | number | undefined,
    string | number | undefined,
    string | number | undefined
  ];
}) => (
  <>
    {props.columns.map((c, index) => (
      <Box key={`column-${index}`}>
        <Text textTransform="uppercase">{c}</Text>
      </Box>
    ))}
  </>
);
