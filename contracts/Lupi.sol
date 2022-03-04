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
  enum GamePhase {
    GUESS,
    REVEAL,
    ENDGAME
  }

  event GameResult(
    bytes32 indexed nonce,
    address indexed winner,
    uint256 award,
    uint32 lowestGuess
  );

  event AwardDeferred(address indexed winner, uint256 amount);
  event AwardWithdrawn(
    address indexed winner,
    address indexed payee,
    uint256 amount
  );
  event AwardForfeited(address indexed winner, uint256 amount);

  bytes32 private currentRound;
  uint256 private rollover;
  mapping(bytes32 => Round) private rounds;
  address private pendingWinner; // Hold funds for this winner if call failes
  uint256 private pendingAmount; // Amount held until the next game starts, otherwise forfeit into rollover
  uint8 private round;

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

  constructor() {
    round = 0;
    newGame();
  }

  function newGame() private {
    round++;

    // If the prior winner failed to receive payment, and failed to collect payment, it is forfeit
    // at the start of the next round
    if (pendingWinner != address(0)) {
      forfeitAward();
    }
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
      payable(msg.sender).transfer(ethToReturn);
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

    uint256 award;

    if (lowestGuess < 0xffffffff && winner != address(0)) {
      // Winner takes all plus rollover
      award = rollover + rounds[currentRound].balance;
      rollover = 0;
    } else {
      // Balance rolls over to next round
      rollover += rounds[currentRound].balance;
    }
    if (award > 0 && winner != address(0)) {
      (bool success, ) = winner.call{gas: 21000, value: award}("");
      if (!success) {
        deferAward(winner, award);
      }
    }
    emit GameResult(
      rounds[currentRound].nonce,
      winner,
      award,
      lowestGuess < 0xffffffff ? lowestGuess : 0
    );

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

  /**
   * @dev Deposit balance for a winner when the call in endGame failed.
   * @param winner The address to which funds may be claimed from.
   */
  function deferAward(address winner, uint256 amount) internal {
    require(
      pendingAmount == 0 && pendingWinner == address(0),
      "Only one pending at a time"
    );
    pendingWinner = winner;
    pendingAmount = amount;
    emit AwardDeferred(winner, amount);
  }

  /**
   * @dev Withdraw deferred balance for a winner when the call in endGame failed.
   * @param payee The address to which funds will be sent to.
   */
  function withdrawAward(address payable payee) public nonReentrant {
    require(
      msg.sender == pendingWinner,
      "Only the winning address may withdraw"
    );
    uint256 amount = pendingAmount;
    address winner = pendingWinner;
    delete pendingAmount;
    delete pendingWinner;

    (bool success, ) = payee.call{value: amount}("");
    require(success, "withdrawAward unable to send value");
    emit AwardWithdrawn(winner, payee, amount);
  }

  /**
   * @dev Forfeit balance for a winner when the balance wasn't retrieved prior to the
   * next round starting.
   */
  function forfeitAward() internal {
    require(
      pendingAmount != 0 && pendingWinner != address(0),
      "No pending award to forfeit"
    );
    emit AwardForfeited(pendingWinner, pendingAmount);
    delete pendingWinner;
    delete pendingAmount;
  }

  function getPlayers() public view returns (address[] memory) {
    return rounds[currentRound].players;
  }

  function getCurrentBalance() public view returns (uint256) {
    return rounds[currentRound].balance;
  }

  function getRolloverBalance() public view returns (uint256) {
    return rollover;
  }

  function getRound() public view returns (uint8) {
    return round;
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
