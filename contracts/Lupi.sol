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

contract Lupi is ReentrancyGuard {
  uint256 private constant TICKET_PRICE = 0.01 ether;
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

  event AwardDeferred(
    bytes32 indexed nonce,
    address indexed winner,
    uint256 amount
  );
  event AwardWithdrawn(
    bytes32 indexed nonce,
    address indexed winner,
    address indexed payee,
    uint256 amount
  );
  event AwardForfeited(
    bytes32 indexed nonce,
    address indexed winner,
    uint256 amount
  );

  bytes32 private currentRound;
  uint256 private rollover;
  mapping(bytes32 => Round) private rounds;
  bytes32 private pendingAwardRound;
  address private pendingWinner = address(0); // Hold funds for this winner if call fails
  uint256 private pendingAmount = 0; // Amount held until the next game starts, otherwise forfeit into rollover
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

  function getSaltedHash(
    bytes32 nonce,
    uint32 answer,
    bytes32 salt
  ) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(nonce, answer, salt));
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

  function commitGuess(bytes32 guessHash) external payable nonReentrant {
    require(
      block.timestamp < rounds[currentRound].guessDeadline,
      "Guess deadline has passed"
    );
    require(msg.value >= TICKET_PRICE, "Must send at least TICKET_PRICE");

    if (rounds[currentRound].committedGuesses[msg.sender].length == 0) {
      rounds[currentRound].players.push(msg.sender);
    }
    rounds[currentRound].committedGuesses[msg.sender].push(
      CommitedGuess(guessHash, false)
    );
    rounds[currentRound].balance += TICKET_PRICE;
    uint256 ethToReturn = msg.value - TICKET_PRICE;
    if (ethToReturn > 0) {
      payable(msg.sender).transfer(ethToReturn);
    }
  }

  function revealGuesses(Reveal[] calldata reveals) external {
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
      bool found = false;
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
            getSaltedHash(
              rounds[currentRound].nonce,
              reveals[r].answer,
              reveals[r].salt
            ) == reveals[r].guessHash,
            "Reveal hash does not match guessHash"
          );
          require(
            !rounds[currentRound].committedGuesses[msg.sender][i].revealed,
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

  function getCurrentNonce() external view returns (bytes32) {
    return (rounds[currentRound].nonce);
  }

  function endGame() external nonReentrant {
    require(
      block.timestamp > rounds[currentRound].revealDeadline,
      "Still in reveal phase"
    );
    uint32 lowestGuess = 0xffffffff;
    address winner = address(0);

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

    uint256 award = 0;
    bytes32 nonce = rounds[currentRound].nonce;

    if (lowestGuess < 0xffffffff && winner != address(0)) {
      // Winner takes all plus rollover
      award = rollover + rounds[currentRound].balance;
      rollover = 0;
    } else {
      // Balance rolls over to next round
      rollover += rounds[currentRound].balance;
    }

    bytes32 priorRound = currentRound;
    for (uint256 i = 0; i < rounds[currentRound].players.length; i++) {
      delete rounds[currentRound].committedGuesses[
        rounds[currentRound].players[i]
      ];
    }
    delete rounds[currentRound].revealedGuesses;
    delete rounds[currentRound].players;
    //slither-disable-next-line mapping-deletion
    delete rounds[currentRound];
    newGame();
    bool success = false;
    if (award > 0 && winner != address(0)) {
      //slither-disable-next-line reentrancy-eth
      (success, ) = winner.call{gas: 21000, value: award}("");
    }
    emit GameResult(
      nonce,
      winner,
      award,
      lowestGuess < 0xffffffff ? lowestGuess : 0
    );
    if (!success && award > 0 && winner != address(0)) {
      deferAward(priorRound, winner, award);
    }
  }

  function getCommittedGuessHashes(address player)
    external
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
  function deferAward(
    bytes32 roundNonce,
    address winner,
    uint256 amount
  ) internal {
    pendingWinner = winner;
    pendingAmount = amount;
    pendingAwardRound = roundNonce;
    emit AwardDeferred(roundNonce, winner, amount);
  }

  /**
   * @dev Withdraw deferred balance for a winner when the call in endGame failed.
   * @param payee The address to which funds will be sent to.
   */
  function withdrawAward(address payable payee) external nonReentrant {
    require(
      msg.sender == pendingWinner,
      "Only the winning address may withdraw"
    );
    require(payee != address(0), "Not allowed to transfer to address(0)");
    bytes32 roundNonce = pendingAwardRound;
    uint256 amount = pendingAmount;
    address winner = pendingWinner;

    delete pendingAmount;
    delete pendingWinner;
    delete pendingAwardRound;

    (bool success, ) = payee.call{value: amount}("");
    require(success, "withdrawAward unable to send value");
    emit AwardWithdrawn(roundNonce, winner, payee, amount);
  }

  /**
   * @dev Forfeit balance for a winner when the balance wasn't retrieved prior to the
   * next round starting.
   */
  function forfeitAward() internal {
    rollover += pendingAmount;
    emit AwardForfeited(pendingAwardRound, pendingWinner, pendingAmount);
    delete pendingAwardRound;
    delete pendingWinner;
    delete pendingAmount;
  }

  function getPlayers() external view returns (address[] memory) {
    return rounds[currentRound].players;
  }

  function getCurrentBalance() external view returns (uint256) {
    return rounds[currentRound].balance;
  }

  function getRolloverBalance() external view returns (uint256) {
    return rollover;
  }

  function getRound() external view returns (uint8) {
    return round;
  }

  function getPendingWinner() external view returns (address) {
    return pendingWinner;
  }

  function getPhase() external view returns (GamePhase) {
    if (block.timestamp <= rounds[currentRound].guessDeadline) {
      return GamePhase.GUESS;
    } else if (block.timestamp <= rounds[currentRound].revealDeadline) {
      return GamePhase.REVEAL;
    } else {
      return GamePhase.ENDGAME;
    }
  }

  function getPhaseDeadline() external view returns (uint256) {
    if (block.timestamp <= rounds[currentRound].guessDeadline) {
      return rounds[currentRound].guessDeadline;
    } else if (block.timestamp <= rounds[currentRound].revealDeadline) {
      return rounds[currentRound].revealDeadline;
    } else {
      return 0;
    }
  }

  function getRevealedGuess() external view returns (uint256[] memory) {
    uint256[] memory guesses = new uint256[](
      rounds[currentRound].revealedGuesses.length
    );

    for (uint256 i = 0; i < rounds[currentRound].revealedGuesses.length; i++) {
      guesses[i] = rounds[currentRound].revealedGuesses[i].guess;
    }
    return guesses;
  }
}
