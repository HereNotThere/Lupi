import { useLupiContractContext } from "src/hooks/useLupiContract";
import { useWeb3Context } from "src/hooks/useWeb3";
import { Box, Grid, Text } from "src/ui";
import { getShortAddress } from "src/utils/lupiUtils";

export const PastGames = () => {
  const { finishedGames } = useLupiContractContext();
  return <GameList games={finishedGames}></GameList>;
};

interface Props {
  games: {
    timestamp: number;
    round: number;
    award: string;
    lowestGuess: string;
    winner: string;
  }[];
}

export const GameList = (props: Props) => {
  const { accounts } = useWeb3Context();
  return (
    <Box alignItems="center" verticalPadding="lg">
      <Grid columns={5} maxWidth={800} gap="lg">
        <ResultRow
          self={false}
          columns={["Round", "Date", "Pot", "LUPI", "Winner"]}
        ></ResultRow>
        {props.games.map((result, index) => {
          return (
            <ResultRow
              key={`${result.round}-${index}`}
              self={accounts[0].toLowerCase() === result.winner.toLowerCase()}
              columns={[
                result.round,
                new Date(result.timestamp * 1000).toLocaleString(),
                result.award.toString(),
                result.lowestGuess.toString(),
                getShortAddress(result.winner),
              ]}
            ></ResultRow>
          );
        })}
      </Grid>
    </Box>
  );
};

const ResultRow = (props: {
  self: boolean;
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
      <Box key={`column-${index}`} color={props.self ? "primary" : "text"}>
        <Text textTransform="uppercase">{c}</Text>
      </Box>
    ))}
  </>
);
