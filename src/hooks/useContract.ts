import { ethers } from "ethers";
import { useState } from "react";
import Lupi from "../artifacts/contracts/Lupi.sol/Lupi.json";

declare let window: any;

// Lupi on Rinkeby
const lupiAddress = "0xa586B7adE6E07FD3B5f1A5a37882D53c28791aDb";
//const lupiAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
// const lupiAddress = "0x0B306BF915C4d645ff596e518fAf3F9669b97016";

export const useContract = (guess: string, revealedGuess: string) => {
  // const [guessHash, setGuessHash] = useState("");

  const [allRevealedGuesses, setAllRevealedGuesses] = useState("");
  const [, setWinner] = useState("");
  const [, setLowestGuess] = useState("");

  async function requestAccount() {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }

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

  async function getFinishedGames() {
    if (typeof window.ethereum === "undefined") {
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const contract = new ethers.Contract(lupiAddress, Lupi.abi, provider);

    const eventFilter = contract.filters.GameResult(); //.ContractEvent()
    const events = await contract.queryFilter(eventFilter, 0, "latest");

    console.log(events);
  }

  async function fetchRevealedGuesses() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, provider);
      try {
        const data = await contract.getRevealedGuess();
        console.log("data: ", data);
        setAllRevealedGuesses(data.toString());
      } catch (err) {
        console.log("Error: ", err);
      }
    }
  }

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
  async function fetchWinner() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, provider);
      try {
        const data = await contract.getWinner();
        console.log("data: ", data);
        setWinner(data.toString());
      } catch (err) {
        console.log("Error: ", err);
      }
    }
  }
  async function fetchLowestGuess() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, provider);
      try {
        const data = await contract.getLowestGuess();
        console.log("data: ", data.toNumber());
        setLowestGuess(data.toNumber());
      } catch (err) {
        console.log("Error: ", err);
      }
    }
  }

  async function callEndGame() {
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, signer);
      const transaction = await contract.endGame();
      await transaction.wait();
    }
  }

  async function commitGuess() {
    if (!guess) return;
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, signer);

      const secret = ethers.utils.formatBytes32String("secret");
      const guessHash = contract.getSaltedHash(parseInt(guess), secret);
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      const transaction = await contract.commitGuess(guessHash, overrides);
      await transaction.wait();
    }
  }

  async function revealGuess() {
    if (!revealedGuess) return;
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, signer);
      const secret = ethers.utils.formatBytes32String("secret");
      const guessHash = await contract.getSaltedHash(
        parseInt(revealedGuess),
        secret
      );
      const transaction = await contract.revealGuess(
        guessHash,
        revealedGuess,
        secret
      );
      await transaction.wait();
    }
  }

  return {
    allRevealedGuesses,
    callEndGame,
    commitGuess,
    fetchLowestGuess,
    fetchRevealedGuesses,
    fetchWinner,
    getFinishedGames,
    revealGuess,
  };
};
