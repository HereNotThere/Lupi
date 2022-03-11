import { useCallback, useMemo, useState } from "react";
import { ChainWarning } from "./components/ChainWarning";
import { DebugPanel } from "./components/DebugPanel";
import { MenuId, SiteHeader } from "./components/SiteHeader";
import { LupiContractProvider, supportedChain } from "./hooks/useLupiContract";
import { useWeb3Context, WalletStatus } from "./hooks/useWeb3";
import { Box } from "./ui";
import { GamePhases } from "./views/GamePhases";
import { HowToPlayView } from "./views/HowToPlayPopup";
import { PastGames } from "./views/PastGames";

const debugPanel = Boolean(
  new URLSearchParams(window.location.search).get("debugPanel")
);

function App() {
  const [pageId, setPageId] = useState<MenuId>("current-game");
  const [popup, setPopup] = useState(false);
  const { chainId, walletStatus } = useWeb3Context();
  const isChainSupported = useMemo(() => supportedChain(chainId), [chainId]);

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
        {isChainSupported && walletStatus === WalletStatus.Unlocked ? (
          <LupiContractProvider>
            <Box row grow alignContent="center" justifyContent="center">
              <Box grow maxWidth={1200}>
                {pageId === "past-games" ? <PastGames /> : <GamePhases />}
              </Box>
            </Box>
            {debugPanel && (
              <Box maxWidth={1200}>
                <DebugPanel />
              </Box>
            )}
            {popup ? <HowToPlayView onClose={onPopupClose} /> : <></>}
          </LupiContractProvider>
        ) : (
          <Box grow centerContent>
            <ChainWarning isChainSupported={!!isChainSupported} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default App;
