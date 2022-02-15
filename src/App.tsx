import React, { useState } from 'react'
import { ethers } from 'ethers'
import './App.css'

import Lupi from './artifacts/contracts/Lupi.sol/Lupi.json'

declare let window: any

const lupiAddress = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'

function App() {
  const [guess, setGuessValue] = useState('')
  const [winner, setWinner] = useState('')
  const [lowestGuess, setLowestGuess] = useState('')
  const [guessCount, setGuessCount] = useState('')

  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' })
  }

  async function fetchGuessCounter() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, provider)
      try {
        const data = await contract.getGuessCounter()
        console.log('data: ', data.toNumber())
        setGuessCount(data.toNumber())
      } catch (err) {
        console.log('Error: ', err)
      }
    }
  }
  async function fetchWinner() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, provider)
      try {
        const data = await contract.getWinner()
        console.log('data: ', data)
        setWinner(data.toString())
      } catch (err) {
        console.log('Error: ', err)
      }
    }
  }
  async function fetchLowestGuess() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, provider)
      try {
        const data = await contract.getLowestGuess()
        console.log('data: ', data.toNumber())
        setLowestGuess(data.toNumber())
      } catch (err) {
        console.log('Error: ', err)
      }
    }
  }

  async function callEndGame() {
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, signer)
      const transaction = await contract.endGame()
      await transaction.wait()
    }
  }

  async function submitGuess() {
    if (!guess) return

    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, signer)
      const transaction = await contract.commitGuess(guess)
      await transaction.wait()
      // fetchGreeting();
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        Annnnnndddd we are back
        <button onClick={fetchGuessCounter}>Fetch Guess Count</button>
        Total Number of Guesses: {guessCount}
        <button onClick={fetchWinner}>Fetch Winner</button>
        Winner: {winner}
        <button onClick={fetchLowestGuess}>Fetch Lowest Guess</button>
        Lowest Guess: {lowestGuess}
        {/* <button onClick = {setGreeting}>Set Greeting</button> */}
        <input
          onChange={(e) => setGuessValue(e.target.value)}
          placeholder="Enter guess"
        />
        <button onClick={submitGuess}>Submit Guess</button>
        <button onClick={callEndGame}>End Game</button>
      </header>
    </div>
  )
}

export default App
