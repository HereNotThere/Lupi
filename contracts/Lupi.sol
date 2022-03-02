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

// if everyone reveals game is over
// if time runs out game is over
// only need a mapping if time limit based, but since we need to know when
// all are revealed, need to keep track of all the addresses in an array

//payables

contract Lupi {
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
        mapping(address => CommitGuess[]) committedGuesses;
        RevealGuess[] revealedGuesses;
        address[] players;
    }

    struct CommitGuess {
        bytes32 guessHash;
        bool revealed;
    }

    struct RevealGuess {
        address player;
        uint32 guess;
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

    function commitGuess(bytes32 guessHash) public {
        require(
            block.timestamp < rounds[currentRound].guessDeadline,
            "Guess deadline has passed"
        );
        if (rounds[currentRound].committedGuesses[msg.sender].length == 0) {
            rounds[currentRound].players.push(msg.sender);
        }
        rounds[currentRound].committedGuesses[msg.sender].push(
            CommitGuess(guessHash, false)
        );
    }

    function revealGuess(
        bytes32 guessHash,
        uint32 answer,
        bytes32 salt
    ) public {
        require(
            block.timestamp > rounds[currentRound].guessDeadline,
            "revealGuess guessDeadline hasn't passed"
        );
        require(
            block.timestamp < rounds[currentRound].revealDeadline,
            "revealGuess revealDeadline has passed"
        );
        require(answer > 0, "revealGuess answer must be positive");
        require(
            rounds[currentRound].committedGuesses[msg.sender].length > 0,
            "No guesses to reveal"
        );
        require(
            getSaltedHash(answer, salt) == guessHash,
            "Reveal hash does not match guessHash"
        );
        bool found;

        uint256 length = rounds[currentRound]
            .committedGuesses[msg.sender]
            .length;
        for (uint256 i = 0; i < length; i++) {
            if (
                rounds[currentRound]
                .committedGuesses[msg.sender][i].guessHash == guessHash
            ) {
                require(
                    rounds[currentRound]
                    .committedGuesses[msg.sender][i].revealed == false,
                    "Already revealed"
                );
                rounds[currentRound]
                .committedGuesses[msg.sender][i].revealed = true;
                RevealGuess memory rg;
                rg.guess = answer;
                rg.player = msg.sender;
                rounds[currentRound].revealedGuesses.push(rg);
                found = true;
                break;
            }
        }
        require(found, "revealGuess no matching guessHash found");
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
            keccak256(
                abi.encodePacked(rounds[currentRound].nonce, answer, salt)
            );
    }

    function endGame() public {
        require(
            block.timestamp > rounds[currentRound].revealDeadline,
            "Still in reveal phase"
        );
        uint32 lowestGuess = 0xffffffff;
        address winner;

        for (
            uint256 i = 0;
            i < rounds[currentRound].revealedGuesses.length;
            i++
        ) {
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
                        lowestGuess = rounds[currentRound]
                            .revealedGuesses[i]
                            .guess;
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
            guesses[i] = rounds[currentRound]
            .committedGuesses[player][i].guessHash;
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

        for (
            uint256 i = 0;
            i < rounds[currentRound].revealedGuesses.length;
            i++
        ) {
            guesses[i] = rounds[currentRound].revealedGuesses[i].guess;
        }
        return guesses;
    }
}
