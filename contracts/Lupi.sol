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
    RevealGuess[] private revealedGuesses;

    uint32 private guessCounter;
    uint private lowestGuess;
    string private gameVersion;
    address private winner;

    uint constant guessDeadline = 1645158215;
    uint constant revealDeadline = 1645158215 + (60*60*24);


    struct RevealGuess {
        uint guess;
        address player;
    }

    struct CommitGuess { 
        bytes32 guessHash;
        uint64 block;
        bool revealed;
    }


    constructor(string memory _gameVersion) {
        console.log("Deploying Lupi Game Version:", _gameVersion);
        gameVersion = _gameVersion;
    }

    function getGameVersion() public view returns (string memory){
        return gameVersion;
    }

    function commitGuess(bytes32 guessHash) public {
        require(block.timestamp < guessDeadline, "Guess deadline has passed");
        committedGuesses[msg.sender].guessHash = guessHash;
        committedGuesses[msg.sender].block= uint64(block.number);
        committedGuesses[msg.sender].revealed= false;
    }

    function revealGuess(uint32 answer, bytes32 salt) public {
        require(block.timestamp > guessDeadline, "Still in guess phase");
        require(block.timestamp < revealDeadline, "Reveal deadline has passed");
        require(answer > 0, "Answer must be positive");
        require(committedGuesses[msg.sender].revealed==false, "Already revealed");
        committedGuesses[msg.sender].revealed=true;
        require(getSaltedHash(answer,salt)==committedGuesses[msg.sender].guessHash,"Revealed hash does not match commit");
        RevealGuess memory rg;
        rg.guess = answer;
        rg.player = msg.sender;
        revealedGuesses.push(rg);
    }

    function getSaltedHash(uint32 guessData, bytes32 salt) public view returns (bytes32){
        return keccak256(abi.encodePacked(address(this), guessData, salt));
    }

    function endGame() public {
        require(block.timestamp > revealDeadline, "Still in reveal phase");
        uint tempLowestGuess = 9999;
        address tempWinner;
        
        
        bool found = false;
        //...
        for(uint i=0; i < revealedGuesses.length; i++){
            if(revealedGuesses[i].guess < tempLowestGuess){
                tempLowestGuess = revealedGuesses[i].guess;
                tempWinner = revealedGuesses[i].player;
                for(uint x = 0; x < revealedGuesses.length; x++){
                    if((revealedGuesses[x].guess < tempLowestGuess) || (revealedGuesses[x].guess == tempLowestGuess && revealedGuesses[x].player != tempWinner) ){
                        break;
                    }
                    if(x == revealedGuesses.length - 1){
                        found = true;
                    }
                }
            }
            if(found){
                break;
            }
        }

        if(found){
            lowestGuess = tempLowestGuess;
            winner = tempWinner;
        }
    }

    function newGame() public {
        lowestGuess = 0;
        winner = address(0);
    }
    
    function getGuessCounter() public view returns (uint32 counter){
        return guessCounter;
    }

    function getWinner() public view returns (address) {
        return winner;
    }

    function getLowestGuess() public view returns (uint) {
        return lowestGuess;
    }

    function getCommittedGuessHash() public view returns (bytes32) {
        return committedGuesses[msg.sender].guessHash;
    }
    
    function getRevealedGuess() public view returns (uint[] memory) {
        console.logUint(revealedGuesses.length);
        uint[] memory guesses = new uint[](revealedGuesses.length);

        for(uint i=0; i < revealedGuesses.length; i++){
            guesses[i]=revealedGuesses[i].guess;
        }
        return guesses;
    }

}
