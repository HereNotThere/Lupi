import { AnimatePresence } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { ChainWarning } from "./components/ChainWarning";
import { DebugPanel } from "./components/DebugPanel";
import { Footer } from "./components/Footer";
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

  const onSelectMenuItem = useCallback(
    (menuId: string) => {
      switch (menuId) {
        case "how-to-play": {
          setPopup(true);
          return;
        }
        case "past-games":
        case "current-game": {
          if (pageId !== menuId) {
            setPageId(menuId);
          } else {
            setPageId("current-game");
          }

          break;
        }
      }
    },
    [pageId]
  );

  const onPopupClose = useCallback(() => {
    setPopup(false);
  }, []);

  return (
    <Box padding="md" gap="lg">
      {/* above the fold container */}
      <Box grow minHeight={`calc(100vh - var(--bl14))`}>
        <SiteHeader onSelectMenuItem={onSelectMenuItem} pageId={pageId} />
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
          </LupiContractProvider>
        ) : (
          <Box grow centerContent>
            <ChainWarning isChainSupported={!!isChainSupported} />
          </Box>
        )}
      </Box>
      <Footer onSelectMenuItem={onSelectMenuItem} />
      <AnimatePresence>
        {popup ? <HowToPlayView onClose={onPopupClose} key="howto" /> : <></>}
      </AnimatePresence>
    </Box>
  );
}

export default App;
