import React, { useState } from 'react'
import { ethers } from 'ethers'
import './App.css'

import Lupi from './artifacts/contracts/Lupi.sol/Lupi.json'

declare let window: any

const lupiAddress = '0x0B306BF915C4d645ff596e518fAf3F9669b97016'

function App() {
  const [guess, setGuessValue] = useState('')
  const [guessHash, setGuessHash] = useState('')
  const [revealedGuess, setRevealedGuessValue] = useState('')
  const [allRevealedGuesses, setAllRevealedGuesses] = useState('')
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
  async function fetchRevealedGuesses() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, provider)
      try {
        const data = await contract.getRevealedGuess()
        console.log('data: ', data)
        setAllRevealedGuesses(data.toString())
      } catch (err) {
        console.log('Error: ', err)
      }
    }
  }

  async function fetchGuessHashes() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, provider)
      try {
        const data = await contract.getCommittedGuessHashes()
        console.log('data: ', data.toString())
        setGuessHash(data.toString())
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

  async function commitGuess() {
    if (!guess) return
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, signer)

      const secret = ethers.utils.formatBytes32String('secret')
      const guessHash = contract.getSaltedHash(parseInt(guess), secret)

      const transaction = await contract.commitGuess(guessHash)
      await transaction.wait()
    }
  }

  async function revealGuess() {
    if (!revealedGuess) return
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(lupiAddress, Lupi.abi, signer)
      const secret = ethers.utils.formatBytes32String('secret')
      const guessHash = await contract.getSaltedHash(
        parseInt(revealedGuess),
        secret
      )
      const transaction = await contract.revealGuess(
        guessHash,
        revealedGuess,
        secret
      )
      await transaction.wait()
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        Lupi
        {/* <button onClick={fetchGuessCounter}>Fetch Guess Count</button>
        Total Number of Guesses: {guessCount} */}
        <button onClick={fetchWinner}>Fetch Winner</button>
        Winner: {winner}
        <button onClick={fetchLowestGuess}>Fetch Lowest Guess</button>
        Lowest Guess: {lowestGuess}
        <button onClick={fetchGuessHashes}>Fetch Guess Hash</button>
        Guess Hash: {guessHash}
        <button onClick={fetchRevealedGuesses}>Fetch Revealed Guesses</button>
        Revealed Guesses: {allRevealedGuesses}
        {/* <button onClick = {setGreeting}>Set Greeting</button> */}
        <input
          onChange={(e) => setGuessValue(e.target.value)}
          placeholder="Commit guess"
        />
        <button onClick={commitGuess}>Commit Guess</button>
        <input
          onChange={(e) => setRevealedGuessValue(e.target.value)}
          placeholder="Reveal guess"
        />
        <button onClick={revealGuess}>Reveal Guess</button>
        <button onClick={callEndGame}>End Game</button>
      </header>
    </div>
  )
}

export default App
