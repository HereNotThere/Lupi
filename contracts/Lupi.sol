//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

// if everyone reveals game is over
// if time runs out game is over
// only need a mapping if time limit based, but since we need to know when
// all are revealed, need to keep track of all the addresses in an array

//needs to deploy a new contract rather than reset

//multiple bids per address
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
    }

    struct CommitGuess {
        bytes32 guessHash;
        uint256 blockNumber;
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
        CommitGuess memory guess;
        guess.guessHash = guessHash;
        guess.revealed = false;
        guess.blockNumber = block.number;
        rounds[currentRound].committedGuesses[msg.sender].push(guess);
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
        for (
            uint256 i = 0;
            i < rounds[currentRound].committedGuesses[msg.sender].length;
            i++
        ) {
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

    function getCommittedGuessHashes() public view returns (bytes32[] memory) {
        bytes32[] memory guesses = new bytes32[](
            rounds[currentRound].committedGuesses[msg.sender].length
        );
        for (
            uint256 i = 0;
            i < rounds[currentRound].committedGuesses[msg.sender].length;
            i++
        ) {
            guesses[i] = rounds[currentRound]
            .committedGuesses[msg.sender][i].guessHash;
        }
        return guesses;
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
