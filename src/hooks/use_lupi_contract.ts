import { BigNumber, ethers, utils } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWeb3Context } from "./use_web3";
import LupiAbi from "../artifacts/contracts/Lupi.sol/Lupi.json";
import { Lupi } from "typechain-types";

// Lupi on Rinkeby
const lupiAddress = "0xa586B7adE6E07FD3B5f1A5a37882D53c28791aDb";
//const lupiAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
// const lupiAddress = "0x0B306BF915C4d645ff596e518fAf3F9669b97016";

function getGuessHash(currentNonce: string, guess: number, salt: string) {
  return utils.solidityKeccak256(
    ["bytes32", "uint32", "bytes32"],
    [currentNonce, guess, salt]
  );
}

export const useLupiContract = () => {
  const { provider } = useWeb3Context();

  const signer = useMemo(() => provider?.getSigner(), [provider]);
  const contract = useMemo(
    () =>
      provider
        ? (new ethers.Contract(lupiAddress, LupiAbi.abi, provider) as Lupi)
        : undefined,
    [provider]
  );

  const contractSigner = useMemo(
    () =>
      signer
        ? (new ethers.Contract(lupiAddress, LupiAbi.abi, signer) as Lupi)
        : undefined,
    [signer]
  );

  // const [guessHash, setGuessHash] = useState("");

  /*
  async function fetchGuessCounter() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, provider);
      try {
        const data = await contract.getGuessCounter();
        console.log("data: ", data.toNumber());
        setGuessCount(data.toNumber());
      } catch (err) {
        console.log("Error: ", err);
      }
    }
  }
  */

  /*

    function getCurrentBalance() public view returns (uint256) {
    return rounds[currentRound].balance;
  }

  function getRolloverBalance() public view returns (uint256) {
    return rollover;
  }

  function getRound() public view returns (uint8) {
    return round;
  }

  function getPendingWinner() public view returns (address) {
    return pendingWinner;
  }

  function getPhase() public view returns (GamePhase) {
    if (block.timestamp <= rounds[currentRound].guessDeadline) {
      return GamePhase.GUESS;
    } else if (block.timestamp <= rounds[currentRound].revealDeadline) {
      return GamePhase.REVEAL;
    } else {
      return GamePhase.ENDGAME;
    }
  }

  function getPhaseDeadline() public view returns (uint256) {
    if (block.timestamp <= rounds[currentRound].guessDeadline) {
      return rounds[currentRound].guessDeadline - block.timestamp;
    } else if (block.timestamp <= rounds[currentRound].revealDeadline) {
      return rounds[currentRound].revealDeadline - block.timestamp;
    } else {
      return 0;
    }
  }

  */

  const [currentBalance, setCurrentBalance] = useState<BigNumber>();

  useEffect(() => {
    void (async () => {
      if (contract) {
        const currentBalance = await contract.getCurrentBalance();
        setCurrentBalance(currentBalance);
      }
    })();
  }, [contract]);

  const [rolloverBalance, setRolloverBalance] = useState<BigNumber>();

  useEffect(() => {
    void (async () => {
      if (contract) {
        const rolloverBalance = await contract.getRolloverBalance();
        setRolloverBalance(rolloverBalance);
      }
    })();
  }, [contract]);

  const [round, setRound] = useState<number>();

  useEffect(() => {
    void (async () => {
      if (contract) {
        const round = await contract.getRound();
        setRound(round);
      }
    })();
  }, [contract]);

  const [phase, setPhase] = useState<number>();

  useEffect(() => {
    void (async () => {
      if (contract) {
        const phase = await contract.getPhase();
        setPhase(phase);
      }
    })();
  }, [contract]);

  const [phaseDeadline, setPhaseDeadline] = useState<number>();

  useEffect(() => {
    void (async () => {
      if (contract) {
        const phaseDeadline = await contract.getPhaseDeadline();
        setPhaseDeadline(
          phaseDeadline ? BigNumber.from(phaseDeadline).toNumber() : 0
        );
      }
    })();
  }, [contract]);

  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      if (contract) {
        const players = await contract.getPlayers();
        setPlayers(players);
      }
    })();
  }, [contract]);

  const [guessHashes, setGuessHashes] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      if (contract) {
        const guessHashes = (
          await Promise.all(
            players.map((player) => contract.getCommittedGuessHashes(player))
          )
        ).flatMap((p) => p);
        setGuessHashes(guessHashes);
      }
    })();
  }, [contract, players]);

  const [finishedGames, setFinishedGames] = useState<ethers.Event[]>([]);

  useEffect(() => {
    void (async () => {
      if (contract) {
        const eventFilter = contract.filters.GameResult(); //.ContractEvent()
        const events = await contract.queryFilter(eventFilter, 0, "latest");
        setFinishedGames(events);
      }
    })();
  }, [contract]);

  const [revealedGuesses, setRevealedGuesses] = useState<string>();

  useEffect(() => {
    void (async function getFinishedGames() {
      if (contract) {
        const data = await contract.getRevealedGuess();
        console.log("data: ", data);
        setRevealedGuesses(data.toString());
      }
    })();
  }, [contract]);

  /*
  async function fetchGuessHashes() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, provider);
      try {
        const data = await contract.getCommittedGuessHashes();
        console.log("data: ", data.toString());
        setGuessHash(data.toString());
      } catch (err) {
        console.log("Error: ", err);
      }
    }
  }
  */
  /*
  async function fetchWinner() {
    const data = await contract.getWinner();
    console.log("data: ", data);
    setWinner(data.toString());
  }
  */
  /*
  const [lowestGuess, setLowestGuess] = useState<number>();

  useEffect(() => {
    void (async function getLowestGuess() {
      if (contract) {
        const data = await contract.getLowestGuess();
        setLowestGuess(data);
      }
    })();
  }, [contract]);
  */

  const transactionRunning = useRef(false);
  const callEndGame = useCallback(async () => {
    if (!transactionRunning.current && contractSigner) {
      transactionRunning.current = true;
      const transaction = await contractSigner.endGame();
      await transaction.wait();
      transactionRunning.current = false;
    }
  }, [contractSigner]);

  const commitGuess = useCallback(
    async (guess: string) => {
      if (!transactionRunning.current && contractSigner && contract) {
        transactionRunning.current = true;

        const secret = ethers.utils.formatBytes32String("secret");

        const currentNonce = await contract.getCurrentNonce();
        const guessHash = getGuessHash(currentNonce, parseInt(guess), secret);
        const overrides = {
          value: ethers.utils.parseEther("0.01"),
        };

        const transaction = await contractSigner.commitGuess(
          guessHash,
          overrides
        );
        await transaction.wait();
        transactionRunning.current = false;
      }
    },
    [contract, contractSigner]
  );

  const revealGuess = useCallback(
    async (revealedGuess: string) => {
      if (!transactionRunning.current && contractSigner && contract) {
        transactionRunning.current = true;

        const secret = ethers.utils.formatBytes32String("secret");
        const currentNonce = await contract.getCurrentNonce();
        const guessHash = getGuessHash(
          currentNonce,
          parseInt(revealedGuess),
          secret
        );
        const transaction = await contractSigner.revealGuesses([
          {
            guessHash,
            answer: revealedGuess,
            salt: secret,
          },
        ]);
        await transaction.wait();
        transactionRunning.current = false;
      }
    },
    [contract, contractSigner]
  );

  return {
    round,
    phase,
    phaseDeadline,
    currentBalance,
    rolloverBalance,
    players,
    guessHashes,
    finishedGames,
    revealedGuesses,
    callEndGame,
    commitGuess,
    revealGuess,
  };
};
