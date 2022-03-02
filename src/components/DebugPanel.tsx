import { useState } from 'react'
import { Box, Button, Text } from 'src/ui'
import { useContract } from '../hooks/useContract'

export const DebugPanel = () => {
  const [guess, setGuessValue] = useState('')
  const [revealedGuess, setRevealedGuessValue] = useState('')

  const {
    getFinishedGames,
    guessHash,
    commitGuess,
    revealGuess,
    allRevealedGuesses,
    fetchRevealedGuesses,
    callEndGame,
  } = useContract(guess, revealedGuess)
  return (
    <Box row>
      {/* left container */}
      <Box itemSpace="lg" padding grow>
        <Box padding border centerContent>
          <Text header="large">Commit Guess</Text>
          <input
            onChange={(e) => setGuessValue(e.target.value)}
            placeholder="Commit guess"
          />
          <Button onClick={commitGuess}>Commit Guess</Button>
        </Box>

        {guessHash && (
          <Box padding border centerContent>
            Guess Hash: {guessHash}
          </Box>
        )}

        <Box padding border centerContent>
          <input
            onChange={(e) => setRevealedGuessValue(e.target.value)}
            placeholder="Reveal guess"
          />
          <Button onClick={revealGuess}>Reveal Guess</Button>
        </Box>

        <Box padding border centerContent>
          <Button onClick={callEndGame}>End Game</Button>
        </Box>
      </Box>

      {/* right container */}
      <Box itemSpace="lg" padding grow>
        <Box padding border centerContent>
          <Button onClick={getFinishedGames}>Get Finished Games</Button>
        </Box>

        <Box padding border centerContent>
          <Button onClick={fetchRevealedGuesses}>Fetch Revealed Guesses</Button>
          {allRevealedGuesses && (
            <Box>Revealed Guesses: {allRevealedGuesses}</Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
