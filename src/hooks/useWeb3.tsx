import { ethers } from "ethers";
import { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createGenericContext } from "../utils/createGenericContext";
import { logger } from "../utils/logger";

export const enum WalletStatus {
  Unknown = "Unknown",
  RequestUnlocked = "RequestUnlocked",
  StillRequestUnlocked = "StillRequestUnlocked",
  Unlocked = "Unlocked",
  Error = "Error",
}

const [useWeb3Context, Web3ContextProvider] = createGenericContext<UseWeb3>();

type Web3Error = {
  message?: string;
  code?: string;
  data?: string;
};

function logError(text: string, err: unknown) {
  const error = err as Web3Error;
  logger.error(
    `Error requesting eth_requestAccounts: ${error.message}. Code: ${error.code}. Data: ${error.data}`
  );
}

const Web3Provider = ({ children }: { children: ReactNode }): JSX.Element => {
  const web3 = useWeb3();
  return <Web3ContextProvider value={web3}>{children}</Web3ContextProvider>;
};

export { useWeb3Context, Web3Provider };
export type RequestAccounts = ReturnType<typeof useWeb3>["requestAccounts"];

export type UseWeb3 = ReturnType<typeof useWeb3>;

const useWeb3 = () => {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [chainId, setChainId] = useState<string>();
  const messageId = useRef(0);
  const requestingAccounts = useRef(false);
  const connectingWalletTimeout = useRef<NodeJS.Timeout>();
  useEffect(
    () => () => {
      if (connectingWalletTimeout.current) {
        clearTimeout(connectingWalletTimeout.current);
        connectingWalletTimeout.current = undefined;
      }
    },
    []
  );

  const [walletStatus, setWalletStatus] = useState(WalletStatus.Unknown);
  const [ethereum] = useState(() => {
    if (typeof window !== "undefined" && window?.ethereum) {
      return window.ethereum;
    } else {
      return false;
    }
  });

  const getAccounts = useCallback(async () => {
    const accounts: string[] = await ethereum.request({
      jsonrpc: "2.0",
      id: messageId.current++,
      method: "eth_accounts",
      params: [],
    });
    return accounts;
  }, [ethereum]);

  const getChainId = useCallback(async () => {
    const chainId: string = await ethereum.request({
      jsonrpc: "2.0",
      id: messageId.current++,
      method: "eth_chainId",
      params: [],
    });
    return chainId;
  }, [ethereum]);

  const providerInstalled = useMemo(() => Boolean(ethereum), [ethereum]);

  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();

  useEffect(() => {
    setProvider(new ethers.providers.Web3Provider(window.ethereum));
  }, [accounts, chainId]);

  useEffect(() => {
    let shutdown = false;
    if (ethereum) {
      const onAccountsChanged = (accounts: Array<string>) => {
        if (!shutdown) {
          // If the wallet is unlocked, get the accounts
          logger.info(
            `onAccountsChanged: ${accounts.join(":")} accounts.length ${
              accounts.length
            }`
          );
          setAccounts((oldAccounts) =>
            oldAccounts &&
            oldAccounts.length === accounts.length &&
            oldAccounts.every((oldAccount) =>
              accounts.some((account) => account === oldAccount)
            )
              ? oldAccounts
              : accounts
          );
          if (accounts.length > 0) {
            setWalletStatus(WalletStatus.Unlocked);
          } else {
            setWalletStatus(WalletStatus.Unknown);
          }
        }
      };

      const onChainChanged = (chainId: string) => {
        if (!shutdown) {
          // If the wallet is unlocked, get the chainId
          logger.info(`chainId: ${chainId}`);
          setChainId(chainId);
        }
      };

      ethereum.on("accountsChanged", onAccountsChanged);
      ethereum.on("chainChanged", onChainChanged);
      void (async () => {
        const [accounts, chainId] = await Promise.all([
          getAccounts(),
          getChainId(),
        ]);
        if (!shutdown) {
          setChainId(chainId);
          setAccounts((oldAccounts) =>
            oldAccounts &&
            oldAccounts.length === accounts.length &&
            oldAccounts.every((oldAccount) =>
              accounts.some((account) => account === oldAccount)
            )
              ? oldAccounts
              : accounts
          );
          if (accounts.length > 0) {
            setWalletStatus(WalletStatus.Unlocked);
          } else {
            setWalletStatus(WalletStatus.Unknown);
          }
        }
      })();

      return () => {
        shutdown = true;
        ethereum.removeListener("accountsChanged", onAccountsChanged);
        ethereum.removeListener("chainChanged", onChainChanged);
      };
    }
  }, [ethereum, getAccounts, getChainId]);

  const requestAccounts = useCallback(async () => {
    logger.info(`requestAccounts`);
    if (!requestingAccounts.current) {
      try {
        requestingAccounts.current = true;
        connectingWalletTimeout.current = setTimeout(() => {
          setWalletStatus(WalletStatus.StillRequestUnlocked);
          logger.info(`fired StillRequestUnlocked`);
        }, 15 * 1000);

        setWalletStatus(WalletStatus.RequestUnlocked);
        // If the wallet is locked this will show the connect wallet dialouge and request the user unlock the wallet
        const accounts: string[] = await ethereum.request({
          jsonrpc: "2.0",
          id: messageId.current++,
          method: "eth_requestAccounts",
          params: [],
        });

        const chainId: string = await getChainId();
        logger.info(`requestAccounts ${JSON.stringify({ accounts, chainId })}`);
        setChainId(chainId);
        setAccounts((oldAccounts) =>
          oldAccounts &&
          oldAccounts.length === accounts.length &&
          oldAccounts.every((oldAccount) =>
            accounts.some((account) => account === oldAccount)
          )
            ? oldAccounts
            : accounts
        );
        if (accounts.length > 0) {
          setWalletStatus(WalletStatus.Unlocked);
        } else {
          setWalletStatus(WalletStatus.Unknown);
        }

        return { accounts, chainId };
      } catch (error) {
        logError("Error requesting eth_requestAccounts", error);
        setWalletStatus(WalletStatus.Error);
        return { accounts: [], chainId: undefined };
      } finally {
        requestingAccounts.current = false;
        if (connectingWalletTimeout.current) {
          clearTimeout(connectingWalletTimeout.current);
          connectingWalletTimeout.current = undefined;
        }
      }
    } else {
      return { accounts: [], chainId: undefined };
    }
  }, [ethereum, getChainId]);

  const ecRecover = useCallback(
    async (message: string, signature: string): Promise<string | undefined> => {
      try {
        const signingWallet = await ethereum.request({
          jsonrpc: "2.0",
          id: messageId.current++,
          method: "personal_ecRecover",
          params: [message, signature],
        });

        logger.info(`personal_ecRecover:\n${signingWallet}`);
        return signingWallet;
      } catch (error) {
        logError("Error requesting personal_ecRecover", error);
      }
    },
    [ethereum]
  );

  const sign = useCallback(
    async (
      message: string,
      walletAddress: string
    ): Promise<string | undefined> => {
      try {
        const signature = await ethereum.request({
          jsonrpc: "2.0",
          id: messageId.current++,
          method: "personal_sign",
          params: [message, walletAddress, ""],
        });

        logger.info(`personal_sign:\n${signature}`);
        return signature;
      } catch (error) {
        logError("Error requesting personal_sign", error);
      }
    },
    [ethereum]
  );

  const addArbitrumOneChain = useCallback(async (): Promise<
    string | undefined
  > => {
    try {
      const signature = await ethereum.request({
        jsonrpc: "2.0",
        id: messageId.current++,
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0xa4b1",
            rpcUrls: [
              "https://arb1.arbitrum.io/rpc",
              "wss://arb1.arbitrum.io/ws",
            ],
            chainName: "Arbitrum One",
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            blockExplorerUrls: ["https://arbiscan.io"],
          },
        ],
      });

      logger.info(`wallet_addEthereumChain:\n${signature}`);
      return signature;
    } catch (error) {
      logError("Error requesting wallet_addEthereumChain", error);
    }
  }, [ethereum]);

  const addArbitrumRinkebyChain = useCallback(async (): Promise<
    string | undefined
  > => {
    try {
      // name,title,shortName,chain,networkId,rpc,faucets,infoURL,explorers,parent.

      const signature = await ethereum.request({
        jsonrpc: "2.0",
        id: messageId.current++,
        method: "wallet_addEthereumChain",
        params: [
          {
            chainName: "Arbitrum Rinkeby",
            chainId: "0x66eeb",
            nativeCurrency: {
              name: "Arbitrum Rinkeby Ether",
              symbol: "ARETH",
              decimals: 18,
            },
            rpcUrls: [
              "https://rinkeby.arbitrum.io/rpc",
              "wss://rinkeby.arbitrum.io/ws",
            ],
            blockExplorerUrls: ["https://rinkeby-explorer.arbitrum.io"],
          },
        ],
      });

      logger.info(`wallet_addEthereumChain:\n${signature}`);
      return signature;
    } catch (error) {
      logError("Error requesting wallet_addEthereumChain", error);
    }
  }, [ethereum]);

  /**
   * chainId: A 0x-prefixed hexadecimal string
   */
  const switchEthereumChain = useCallback(
    async (chainId: string): Promise<string | undefined> => {
      try {
        const signature = await ethereum.request({
          jsonrpc: "2.0",
          id: messageId.current++,
          method: "wallet_switchEthereumChain",
          params: [
            {
              chainId,
            },
          ],
        });

        logger.info(`wallet_addEthereumChain:\n${signature}`);
        return signature;
      } catch (error) {
        logError("Error requesting wallet_addEthereumChain", error);
      }
    },
    [ethereum]
  );

  return {
    providerInstalled,
    provider,
    requestAccounts,
    sign,
    ecRecover,
    accounts,
    chainId,
    walletStatus,
    addArbitrumOneChain,
    addArbitrumRinkebyChain,
    switchEthereumChain,
  } as const;
};
