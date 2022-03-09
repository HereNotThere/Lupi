import { useCallback, useMemo, useState } from "react";
import produce from "immer";

import { TicketData } from "src/schema/Ticket";
import { Lupi } from "typechain-types";
import { useLupiContractContext } from "./useLupiContract";
import { useWeb3Context } from "./useWeb3";

type ContractTickets = {
  [contractId: string]:
    | undefined
    | { [round: number]: undefined | TicketData[] };
};

type ChainContracts = {
  [chainId: string]: undefined | ContractTickets;
};

export const useTickets = () => {
  const { chainId } = useWeb3Context();
  const { contractAddress, round } = useLupiContractContext();

  const [tickets, setTickets] = useState<ChainContracts>(() => {
    const saved = window.localStorage.getItem("tickets");
    console.log(`getItem tickets`, saved);
    return saved ? JSON.parse(saved) : {};
  });

  const chainContracts = useCallback(
    (chainId: string) => tickets[chainId],
    [tickets]
  );

  const contractTickets = useCallback(
    (chainId: string) => (contractId: string) =>
      chainContracts(chainId)?.[contractId],
    [chainContracts]
  );

  const chainContractTickets = useCallback(
    (chainId: string) => (contractId: string) =>
      contractTickets(chainId)(contractId),
    [contractTickets]
  );
  const storeTicket = useCallback(
    (ticket: TicketData) => {
      if (chainId && contractAddress && round) {
        setTickets((t) => {
          const newTickets = produce(t, (draft) => {
            const chainTickets = draft[chainId];
            if (chainTickets) {
              const contractTickets = chainTickets[contractAddress];
              if (contractTickets) {
                const roundTickets = contractTickets[round];
                if (roundTickets) {
                  roundTickets.push(ticket);
                } else {
                  contractTickets[round] = [ticket];
                }
              } else {
                const contractTickets: { [contractId: string]: TicketData[] } =
                  {};
                contractTickets[round] = [ticket];
                chainTickets[contractAddress] = contractTickets;
              }
            } else {
              const contractTickets: { [contractId: string]: TicketData[] } =
                {};
              contractTickets[round] = [ticket];
              const chainTickets: {
                [chainId: string]: { [contractId: string]: TicketData[] };
              } = {};
              chainTickets[contractAddress] = contractTickets;
              draft[chainId] = chainTickets;
            }
          });
          const jsonTickets = JSON.stringify(newTickets);
          window.localStorage.setItem("tickets", jsonTickets);
          console.log(`setItem tickets`, jsonTickets);
          const saved = window.localStorage.getItem("tickets");
          console.log(`after setItem`, saved);
          return newTickets;
        });
      } else {
        console.warn(
          `storeTicket called to early`,
          chainId,
          contractAddress,
          round
        );
      }
    },
    [chainId, contractAddress, round]
  );

  return {
    storeTicket,
    chainContractTickets,
  };
};

export const useTicketList = (
  guessHashes?: Lupi.AllCommitedGuessStructOutput[]
) => {
  const { chainId } = useWeb3Context();
  const { chainContractTickets } = useTickets();
  const { contractAddress, round } = useLupiContractContext();

  return useMemo(() => {
    const allTickets =
      chainId && contractAddress && chainContractTickets
        ? chainContractTickets(chainId)(contractAddress) ?? []
        : [];

    const roundTickets = round ? allTickets[round] ?? [] : [];
    const res =
      roundTickets.filter((ticket) =>
        guessHashes?.find((guess) =>
          guess.commitedGuesses.find((t) => t.guessHash === ticket.guessHash)
        )
      ) ?? [];
    return res;
  }, [chainId, guessHashes, round, chainContractTickets, contractAddress]);
};
