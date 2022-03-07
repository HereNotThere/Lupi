import { useCallback, useState } from "react";
import { DebugPanel } from "./components/DebugPanel";
import { MenuId, SiteHeader } from "./components/SiteHeader";
import { Box } from "./ui";
import { HowToPlayView } from "./views/HowToPlayPopup";
import { PastGames } from "./views/PastGames";
import { PlayState } from "./views/PlayView";

function App() {
  const [pageId, setPageId] = useState<MenuId>("current-game");
  const [popup, setPopup] = useState(false);

  const onSelectMenuItem = useCallback((menuId: string) => {
    switch (menuId) {
      case "how-to-play": {
        setPopup(true);
        return;
      }
      case "past-games":
      case "current-game": {
        setPageId(menuId);
        break;
      }
    }
  }, []);

  const onPopupClose = useCallback(() => {
    setPopup(false);
  }, []);

  return (
    <Box padding="md" fillSpace>
      {/* above the fold container */}
      <Box grow minHeight={`100vh`}>
        <SiteHeader onSelectMenuItem={onSelectMenuItem} />
        {pageId !== "past-games" ? <PlayState /> : <PastGames />}
      </Box>
      <Box>
        <DebugPanel />
      </Box>
      {popup ? <HowToPlayView onClose={onPopupClose} /> : <></>}
    </Box>
  );
}

export default App;
