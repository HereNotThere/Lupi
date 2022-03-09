import { useCallback, useEffect, useMemo, useState } from "react";
import Ajv from "ajv";

import produce from "immer";

import { TicketData } from "src/schema/Ticket";
import { Lupi } from "typechain-types";
import { useLupiContractContext } from "./useLupiContract";
import { useWeb3Context } from "./useWeb3";

const ajv = new Ajv();

type ContractTickets = {
  [contractId: string]:
    | undefined
    | { [round: number]: undefined | TicketData[] };
};

type ChainContracts = {
  [chainId: string]: undefined | ContractTickets;
};

const schema = {
  // root
  type: "object",
  additionalProperties: {
    // ChainContracts
    type: "object",
    additionalProperties: {
      // ContractTickets
      type: "object",
      additionalProperties: false,
      patternProperties: {
        // round
        "^[0-9]+$": {
          type: "array",
          items: {
            // TicketData
            type: "object",
            properties: {
              guess: {
                type: "integer",
              },
              guessHash: {
                type: "string",
              },
              roundId: {
                type: "integer",
              },
              salt: {
                type: "string",
              },
            },
          },
        },
      },
    },
  },
} as const;

const validate = ajv.compile<ChainContracts>(schema);

const parseTickets = (saved: string | null): ChainContracts => {
  if (saved) {
    const persistedTickets = JSON.parse(saved);
    if (validate(persistedTickets)) {
      return persistedTickets;
    } else {
      console.warn(`invalid persisted tickets`);
      return {};
    }
  } else {
    return {};
  }
};

export const useTickets = () => {
  const { chainId } = useWeb3Context();
  const { contractAddress, round } = useLupiContractContext();

  const [tickets, setTickets] = useState<ChainContracts>(() => {
    const saved = window.localStorage.getItem("tickets");
    return parseTickets(saved);
  });

  // If any instance of this hook updates storage, let the other instances know
  useEffect(() => {
    const onStorage = () => {
      const saved = window.localStorage.getItem("tickets");
      const parsedTickets = parseTickets(saved);
      console.log(`onStorage changed`, parsedTickets);
      setTickets(parsedTickets);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
