import { useCallback, useEffect, useState } from "react";
import { GameData, useWeb3Context } from "./useWeb3Context";

export const useGameData = () => {
  const { getGameData } = useWeb3Context();

  const [game, setGame] = useState<GameData>();
  const syncGameData = useCallback(async () => {
    const game = await getGameData();
    if (game) {
      setGame(game);
    }
  }, [getGameData]);
  useEffect(() => {
    syncGameData().catch((e) => console.error(e));
  }, [syncGameData]);

  return { game };
};
