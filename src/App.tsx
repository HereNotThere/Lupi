import { DebugPanel } from "./components/DebugPanel";
import { SiteHeader } from "./components/SiteHeader";
import { Box } from "./ui";
import { PlayState } from "./views/PlayView";

export interface RoundData {
  roundId: string;
  jackpot: number;
  entries: number;
  revealDate: Date;
  maxGuess: number;
}

const roundData: RoundData = {
  roundId: "99",
  maxGuess: 999,
  jackpot: 2.5,
  entries: 78,
  revealDate: new Date(Date.now() + 86400000),
};

function App() {
  return (
    <Box padding="md" fillSpace>
      {/* above the fold container */}
      <Box grow minHeight={`100vh`}>
        <SiteHeader />
        <PlayState roundData={roundData} />
      </Box>

      <Box>
        <DebugPanel />
      </Box>
    </Box>
  );
}

export default App;
