import { EthText } from "src/components/EthText";
import { useLupiContractContext } from "src/hooks/useLupiContract";
import { useWeb3Context } from "src/hooks/useWeb3";
import { Box, Grid, Text } from "src/ui";
import { getShortAddress } from "src/utils/lupiUtils";

export const PastGames = () => {
  return <GameList />;
};

const nullAddress = "0x0000000000000000000000000000000000000000";

export const GameList = () => {
  const { finishedGames } = useLupiContractContext();

  const { accounts } = useWeb3Context();
  return (
    <Box alignItems="center" verticalPadding="lg">
      {finishedGames ? (
        <Grid columns={5} maxWidth={1024} gap="lg">
          <ResultRow
            self={false}
            header
            columns={["Round", "Date", "Pot", "LUPI", "Winner"]}
          ></ResultRow>
          {finishedGames
            .slice()
            .reverse()
            .map((result, index) => {
              const isSelf =
                accounts[0].toLowerCase() === result.winner.toLowerCase();
              return (
                <ResultRow
                  key={`${result.round}-${index}`}
                  self={isSelf}
                  columns={[
                    result.round,
                    new Date(result.timestamp * 1000).toLocaleString(),
                    result.lowestGuess ? (
                      <EthText
                        wei={result.award}
                        color={isSelf ? "primary" : "text"}
                      />
                    ) : (
                      "-"
                    ),
                    result.lowestGuess || "-",
                    result.winner === nullAddress
                      ? "No winner (pot rolled over)"
                      : getShortAddress(result.winner),
                  ]}
                ></ResultRow>
              );
            })}
        </Grid>
      ) : (
        <Text>Please hold on, fetching prior results...</Text>
      )}
    </Box>
  );
};

const ResultRow = (props: {
  self: boolean;
  header?: boolean;
  columns: [
    string | number | undefined,
    string | number | undefined,
    JSX.Element | string | undefined,
    string | number | undefined,
    string | number | undefined
  ];
}) => (
  <>
    {props.columns.map((c, index) => (
      <Box key={`column-${index}`} color={props.self ? "primary" : "text"}>
        <Text
          singleLine
          textTransform="uppercase"
          header={props.header ? "regular" : undefined}
        >
          {c}
        </Text>
      </Box>
    ))}
  </>
);
