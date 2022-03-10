import { useCallback, useMemo, useState } from "react";
import { DebugPanel } from "./components/DebugPanel";
import { MenuId, SiteHeader } from "./components/SiteHeader";
import { Box } from "./ui";
import { HowToPlayView } from "./views/HowToPlayPopup";
import { PastGames } from "./views/PastGames";
import { GamePhases } from "./views/GamePhases";
import { LupiContractProvider, supportedChain } from "./hooks/useLupiContract";
import { useWeb3Context, WalletStatus } from "./hooks/useWeb3";

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
                {pageId === "past-games" ? (
                  <PastGames />
                ) : pageId === "debug" ? (
                  <DebugPanel />
                ) : (
                  <GamePhases />
                )}
              </Box>
            </Box>
            {popup ? <HowToPlayView onClose={onPopupClose} /> : <></>}
          </LupiContractProvider>
        ) : (
          <>Unsupported chain</>
        )}
      </Box>
    </Box>
  );
}

export default App;
