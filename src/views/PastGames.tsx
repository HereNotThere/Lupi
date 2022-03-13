import { EthText } from "src/components/EthText";
import { FadeBox, PageTransition } from "src/components/FadeBox";
import { useLupiContractContext } from "src/hooks/useLupiContract";
import { useResponsive } from "src/hooks/useResponsive";
import { useWeb3Context } from "src/hooks/useWeb3";
import { Box, Grid, Text } from "src/ui";
import { getHumanDate, getShortAddress } from "src/utils/lupiUtils";

export const PastGames = () => {
  return <GameList />;
};

const nullAddress = "0x0000000000000000000000000000000000000000";

export const GameList = () => {
  const { finishedGames } = useLupiContractContext();
  const { isSmall } = useResponsive();

  const { accounts } = useWeb3Context();
  return (
    <Box grow centerContent>
      {finishedGames ? (
        finishedGames.length ? (
          <PageTransition transitionType="fast">
            <Box alignItems="center" verticalPadding="lg">
              <Grid columns={5} maxWidth={1024} gap={isSmall ? "sm" : "lg"}>
                <ResultRow
                  small={isSmall}
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
                        small={isSmall}
                        self={isSelf}
                        columns={[
                          result.round,
                          getHumanDate(
                            new Date(result.timestamp * 1000),
                            isSmall
                          ),

                          result.lowestGuess ? (
                            <EthText
                              small={isSmall ? true : undefined}
                              wei={result.award}
                              color={isSelf ? "primary" : "text"}
                            />
                          ) : (
                            "-"
                          ),
                          result.lowestGuess || "-",
                          result.winner === nullAddress
                            ? isSmall
                              ? "No winner"
                              : "No winner (pot rolled over)"
                            : getShortAddress(result.winner),
                        ]}
                      ></ResultRow>
                    );
                  })}
              </Grid>
            </Box>
          </PageTransition>
        ) : (
          <Text>No past games just yet</Text>
        )
      ) : (
        <Text>Please hold on, fetching prior results...</Text>
      )}
    </Box>
  );
};

const ResultRow = (props: {
  self: boolean;
  header?: boolean;
  small: boolean;
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
      <FadeBox key={`column-${index}`} color={props.self ? "primary" : "text"}>
        <Text
          singleLine
          small={props.small || undefined}
          textTransform="uppercase"
          header={
            props.header ? (props.small ? "small" : "regular") : undefined
          }
        >
          {c}
        </Text>
      </FadeBox>
    ))}
  </>
);
