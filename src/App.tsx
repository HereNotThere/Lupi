import { DebugPanel } from "./components/DebugPanel";
import { SiteHeader } from "./components/SiteHeader";
import { Box } from "./ui";
import { PlayState } from "./views/PlayView";

function App() {
  return (
    <Box padding="md" fillSpace>
      {/* above the fold container */}
      <Box grow minHeight={`100vh`}>
        <SiteHeader />
        <PlayState />
      </Box>

      <Box>
        <DebugPanel />
      </Box>
    </Box>
  );
}

export default App;
