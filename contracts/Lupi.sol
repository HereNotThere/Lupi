//SPDX-License-Identifier: Apache-2.0

/******************************************************************************
 * Copyright 2022 Here Not There, Inc. <oss@hntlabs.com>                      *
 *                                                                            *
 * Licensed under the Apache License, Version 2.0 (the "License");            *
 * you may not use this file except in compliance with the License.           *
 * You may obtain a copy of the License at                                    *
 *                                                                            *
 *     http://www.apache.org/licenses/LICENSE-2.0                             *
 *                                                                            *
 * Unless required by applicable law or agreed to in writing, software        *
 * distributed under the License is distributed on an "AS IS" BASIS,          *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   *
 * See the License for the specific language governing permissions and        *
 * limitations under the License.                                             *
 ******************************************************************************/

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// if everyone reveals game is over
// if time runs out game is over
// only need a mapping if time limit based, but since we need to know when
// all are revealed, need to keep track of all the addresses in an array

//payables

uint256 constant ticketPrice = 0.01 ether;

contract Lupi is ReentrancyGuard {
  event GameResult(
    bytes32 indexed nonce,
    address indexed winner,
    uint32 lowestGuess
  );

  string private gameVersion;
  bytes32 private currentRound;
  mapping(bytes32 => Round) private rounds;

  struct Round {
    bytes32 nonce;
    uint256 guessDeadline;
    uint256 revealDeadline;
    uint256 balance;
    mapping(address => CommitedGuess[]) committedGuesses;
    RevealedGuess[] revealedGuesses;
    address[] players;
  }

  struct CommitedGuess {
    bytes32 guessHash;
    bool revealed;
  }

  struct RevealedGuess {
    address player;
    uint32 guess;
  }

  struct Reveal {
    bytes32 guessHash;
    uint32 answer;
    bytes32 salt;
  }

  constructor(string memory _gameVersion) {
    gameVersion = _gameVersion;
    newGame();
  }

  function getGameVersion() public view returns (string memory) {
    return gameVersion;
  }

  function newGame() private {
    currentRound = bytes32(uint256(uint160(address(this))) << 96); // Replace with chainlink random
    rounds[currentRound].guessDeadline = block.timestamp + 3 days;
    rounds[currentRound].revealDeadline = block.timestamp + 5 days;
    rounds[currentRound].nonce = currentRound;
  }

  function commitGuess(bytes32 guessHash) public payable nonReentrant {
    require(
      block.timestamp < rounds[currentRound].guessDeadline,
      "Guess deadline has passed"
    );
    require(msg.value >= ticketPrice, "Must send at least ticketPrice");

    if (rounds[currentRound].committedGuesses[msg.sender].length == 0) {
      rounds[currentRound].players.push(msg.sender);
    }
    rounds[currentRound].committedGuesses[msg.sender].push(
      CommitedGuess(guessHash, false)
    );
    rounds[currentRound].balance += ticketPrice;
    uint256 ethToReturn = msg.value - ticketPrice;
    if (ethToReturn > 0) {
      (bool sent, ) = msg.sender.call{value: ethToReturn}("");
      require(sent, "ethToReturn failed to send");
    }
  }

  function revealGuesses(Reveal[] calldata reveals) public {
    require(
      block.timestamp > rounds[currentRound].guessDeadline,
      "revealGuesses guessDeadline hasn't passed"
    );
    require(
      block.timestamp < rounds[currentRound].revealDeadline,
      "revealGuesses revealDeadline has passed"
    );
    require(
      rounds[currentRound].committedGuesses[msg.sender].length > 0,
      "No guesses to reveal"
    );

    uint256 length = rounds[currentRound].committedGuesses[msg.sender].length;

    for (uint256 r = 0; r < reveals.length; r++) {
      bool found;
      for (uint256 i = 0; i < length; i++) {
        if (
          rounds[currentRound].committedGuesses[msg.sender][i].guessHash ==
          reveals[r].guessHash
        ) {
          require(
            reveals[r].answer > 0,
            "revealGuesses answer must be positive"
          );

          require(
            getSaltedHash(reveals[r].answer, reveals[r].salt) ==
              reveals[r].guessHash,
            "Reveal hash does not match guessHash"
          );
          require(
            rounds[currentRound].committedGuesses[msg.sender][i].revealed ==
              false,
            "Already revealed"
          );
          rounds[currentRound].committedGuesses[msg.sender][i].revealed = true;
          rounds[currentRound].revealedGuesses.push(
            RevealedGuess(msg.sender, reveals[r].answer)
          );
          found = true;
        }
      }

      require(found, "revealGuesses no matching guessHash found");
    }
  }

  function getCurrentNonce() public view returns (bytes32) {
    return (rounds[currentRound].nonce);
  }

  function getSaltedHash(uint32 answer, bytes32 salt)
    public
    view
    returns (bytes32)
  {
    return
      keccak256(abi.encodePacked(rounds[currentRound].nonce, answer, salt));
  }

  function endGame() public nonReentrant {
    require(
      block.timestamp > rounds[currentRound].revealDeadline,
      "Still in reveal phase"
    );
    uint32 lowestGuess = 0xffffffff;
    address winner;

    for (uint256 i = 0; i < rounds[currentRound].revealedGuesses.length; i++) {
      if (rounds[currentRound].revealedGuesses[i].guess < lowestGuess) {
        for (
          uint256 x = 0;
          x < rounds[currentRound].revealedGuesses.length;
          x++
        ) {
          if (
            (rounds[currentRound].revealedGuesses[x].guess ==
              rounds[currentRound].revealedGuesses[i].guess &&
              i != x &&
              rounds[currentRound].revealedGuesses[x].player !=
              rounds[currentRound].revealedGuesses[i].player)
          ) {
            break;
          }
          if (x == rounds[currentRound].revealedGuesses.length - 1) {
            lowestGuess = rounds[currentRound].revealedGuesses[i].guess;
            winner = rounds[currentRound].revealedGuesses[i].player;
          }
        }
      }
    }

    emit GameResult(
      rounds[currentRound].nonce,
      winner,
      lowestGuess < 0xffffffff ? lowestGuess : 0
    );
    if (lowestGuess < 0xffffffff) {
      // Winner takes all
      payable(winner).transfer(rounds[currentRound].balance);
    } else {
      // Push returns funds to all players that revealed
      uint256 split = rounds[currentRound].balance /
        rounds[currentRound].revealedGuesses.length;

      for (
        uint256 i = 0;
        i < rounds[currentRound].revealedGuesses.length;
        i++
      ) {
        payable(rounds[currentRound].revealedGuesses[i].player).transfer(split);
      }
    }
    delete rounds[currentRound];
    newGame();
  }

  function getCommittedGuessHashes(address player)
    public
    view
    returns (bytes32[] memory)
  {
    bytes32[] memory guesses = new bytes32[](
      rounds[currentRound].committedGuesses[player].length
    );
    for (
      uint256 i = 0;
      i < rounds[currentRound].committedGuesses[player].length;
      i++
    ) {
      guesses[i] = rounds[currentRound].committedGuesses[player][i].guessHash;
    }
    return guesses;
  }

  function getPlayers() public view returns (address[] memory) {
    return rounds[currentRound].players;
  }

  function getRevealedGuess() public view returns (uint256[] memory) {
    uint256[] memory guesses = new uint256[](
      rounds[currentRound].revealedGuesses.length
    );

    for (uint256 i = 0; i < rounds[currentRound].revealedGuesses.length; i++) {
      guesses[i] = rounds[currentRound].revealedGuesses[i].guess;
    }
    return guesses;
  }
}
