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
    mapping(address => CommitGuess) private committedGuesses;
    uint32 private lowestGuess;
    string private gameVersion;
    address private winner;
    Round[] private rounds;

    struct Round {
        bytes32 nonce;
        uint guessDeadline;
        uint revealDeadline;
        mapping(address => CommitGuess[]) committedGuesses;
        RevealGuess[] revealedGuesses;
    }

    struct CommitGuess {
        bytes32 guessHash;
        bool revealed;
        uint blockNumber;
    }

    struct RevealGuess {
        uint32 guess;
        address player;
    }

    constructor(string memory _gameVersion) {
        gameVersion = _gameVersion;
        newGame();
    }

    function getGameVersion() public view returns (string memory){
        return gameVersion;
    }

    function newGame() private {
        // Unreachable require
        // require(rounds.length == 0, "newGame when game is running");
        Round storage newRound = rounds.push();
        newRound.guessDeadline = block.timestamp + 3 days;
        newRound.revealDeadline = block.timestamp + 5 days;
        newRound.nonce =  bytes32(uint256(uint160(address(this))) << 96); // Replace with chainlink random
    }

    function commitGuess(bytes32 guessHash) public {
        require(rounds.length == 1, "commitGuess without running game");
        require(block.timestamp < rounds[0].guessDeadline, "Guess deadline has passed");
        CommitGuess memory guess;
        guess.guessHash = guessHash;
        guess.revealed = false;
        guess.blockNumber= block.number;
        rounds[0].committedGuesses[msg.sender].push(guess);
    }

    function revealGuess(bytes32 guessHash, uint32 answer, bytes32 salt) public {
        require(rounds.length == 1, "revealGuess without running game");
        require(block.timestamp > rounds[0].guessDeadline, "revealGuess guessDeadline hasn't passed");
        require(block.timestamp < rounds[0].revealDeadline, "revealGuess revealDeadline has passed");
        require(answer > 0, "revealGuess answer must be positive");
        require(rounds[0].committedGuesses[msg.sender].length > 0, "No guesses to reveal");
        require(getSaltedHash(answer,salt)==guessHash,"Reveal hash does not match guessHash");
        bool found;
        for (uint i = 0; i < rounds[0].committedGuesses[msg.sender].length; i++) {
            if(rounds[0].committedGuesses[msg.sender][i].guessHash == guessHash) {
                require(rounds[0].committedGuesses[msg.sender][i].revealed==false, "Already revealed");
                rounds[0].committedGuesses[msg.sender][i].revealed=true;
                RevealGuess memory rg;
                rg.guess = answer;
                rg.player = msg.sender;
                rounds[0].revealedGuesses.push(rg);
                found = true;
                break;
            }
        }
        require(found, "revealGuess no matching guessHash found");
    }

    function getCurrentNonce() public view returns (bytes32){
        require(rounds.length == 1, "getSaltedHash without running game");
        return (rounds[0].nonce);
    }

    function getSaltedHash(uint32 answer, bytes32 salt) public view returns (bytes32){
        require(rounds.length == 1, "getSaltedHash without running game");
        return keccak256(abi.encodePacked(rounds[0].nonce, answer, salt));
    }

    function endGame() public {
        require(rounds.length == 1, "endGame without running game");
        require(block.timestamp > rounds[0].revealDeadline, "Still in reveal phase");
        uint32 tempLowestGuess = 0xffffffff;
        address tempWinner;
        
        for(uint i=0; i < rounds[0].revealedGuesses.length; i++){
            if(rounds[0].revealedGuesses[i].guess < tempLowestGuess){
                for(uint x = 0; x < rounds[0].revealedGuesses.length; x++){
                    if((rounds[0].revealedGuesses[x].guess == rounds[0].revealedGuesses[i].guess && i != x && rounds[0].revealedGuesses[x].player != rounds[0].revealedGuesses[i].player) ){
                        break;
                    }
                    if(x == rounds[0].revealedGuesses.length - 1){
                        tempLowestGuess = rounds[0].revealedGuesses[i].guess;
                        tempWinner = rounds[0].revealedGuesses[i].player;
                    }
                }
            }
        }

        if(tempLowestGuess < 0xffffffff){
            lowestGuess = tempLowestGuess;
            winner = tempWinner;
        }
        rounds.pop();
        newGame();
    }

    function getWinner() public view returns (address) {
        return winner;
    }

    function getLowestGuess() public view returns (uint) {
        return lowestGuess;
    }

    function getCommittedGuessHashes() public view returns (bytes32 [] memory) {
        bytes32[] memory guesses = new bytes32[](rounds[0].committedGuesses[msg.sender].length);
        for(uint i=0; i < rounds[0].committedGuesses[msg.sender].length; i++){
            guesses[i] = rounds[0].committedGuesses[msg.sender][i].guessHash;
        }
        return guesses;
    }
    
    function getRevealedGuess() public view returns (uint[] memory) {
        uint[] memory guesses = new uint[](rounds[0].revealedGuesses.length);

        for(uint i=0; i < rounds[0].revealedGuesses.length; i++){
            guesses[i]=rounds[0].revealedGuesses[i].guess;
        }
        return guesses;
    }

}
