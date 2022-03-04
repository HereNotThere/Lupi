import styled from "styled-components";
import { DebugPanel } from "./components/DebugPanel";
import { SiteHeader } from "./components/SiteHeader";
import { useGameData } from "./hooks/useGameData";
import { GameData, GamePhase } from "./hooks/useWeb3Context";
import { Box } from "./ui";
import { PlayState } from "./views/PlayView";

function App() {
  const { game } = useGameData();
  const currentView =
    typeof game === "undefined" ? (
      <>LOADING</>
    ) : game.phase === GamePhase.GUESS ? (
      <PlayState />
    ) : game.phase === GamePhase.REVEAL ? (
      <PlayState />
    ) : game.phase === GamePhase.ENDGAME ? (
      <>ENDGAME</>
    ) : (
      <>ERROR</>
    );

  return (
    <Box padding="md" fillSpace>
      {/* above the fold container */}
      <Box grow minHeight={`100vh`}>
        <SiteHeader />
        {currentView}
      </Box>
      <Box>
        <DebugPanel />
      </Box>
      <Debug game={game} />
    </Box>
  );
}

export default App;

const Debug = (props: { game?: GameData }) => (
  <StyledDebug padding="lg">
    <pre>{JSON.stringify(props.game, undefined, 2)}</pre>
  </StyledDebug>
);
const StyledDebug = styled(Box)`
  position: fixed;
  bottom: 0;
`;
