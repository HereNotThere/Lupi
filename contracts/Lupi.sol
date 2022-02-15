//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

//considerations
// if everyone reveals game is over
// if time runs out game is over
// only need a mapping if time limit based, but since we need to know when
// all are revealed, need to keep track of all the addresses in an array

//needs to deploy a new contract rather 

contract Lupi {
    mapping(address => CommitGuess) private committedGuesses;

    RevealGuess[] private revealedGuesses;

    int private guessCounter;
    string private gameVersion;
    int private lowestGuess;
    address private winner;

    struct RevealGuess {
        int guess;
        address player;
    }

    struct CommitGuess { 
        int guess;
        //hash
    }


    constructor(string memory _gameVersion) {
        console.log("Deploying Lupi Game Version:", _gameVersion);
        gameVersion = _gameVersion;
    }

    function commitGuess(int guess) public {
        committedGuesses[msg.sender].guess = guess;
        
        //todo move to reveal func
        RevealGuess memory rg;
        rg.guess = guess;
        rg.player = msg.sender;
        revealedGuesses.push(rg);

        guessCounter = guessCounter+1;
    }

    function endGame() public {

        int tempLowestGuess = 9999;
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
    
    function getGuessCounter() public view returns (int counter){
        return guessCounter;
    }

    function getWinner() public view returns (address) {
        return winner;
    }

    function getLowestGuess() public view returns (int) {
        return lowestGuess;
    }
}
