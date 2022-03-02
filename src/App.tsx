import { DebugPanel } from "./components/DebugPanel";
import { LupiHeader } from "./components/LupiHeader";
import { PlayButton } from "./components/PlayButton";
import { SiteHeader } from "./components/SiteHeader";
import { Box, Text } from "./ui";

function App() {
  return (
    <Box padding fillSpace>
      <Box grow minHeight={`100vh`}>
        <SiteHeader />
        {/* body */}
        <Box row grow>
          {/* left container */}
          <Box grow centerContent itemSpace="md">
            <LupiHeader />
            <Box padding border>
              <Text header="large">
                Current Jackpot{" "}
                <Text span color="primary">
                  2.5eth
                </Text>
              </Text>
            </Box>
          </Box>
          {/* right container */}
          <Box grow centerContent>
            <PlayButton />
          </Box>
        </Box>
      </Box>
      <Box>
        <DebugPanel />
      </Box>
    </Box>
  );
}

export default App;
