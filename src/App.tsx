import { useCallback, useState } from 'react'
import { DebugPanel } from './components/DebugPanel'
import { NumBox } from './components/NumBox'
import { NumPad } from './components/NumPad'
import { SiteHeader } from './components/SiteHeader'
import { Box, Grid, Text } from './ui'

function App() {
  const [inputValue, setInputValue] = useState(0)

  const onKeyPadPress = useCallback((char: string) => {
    if (char === 'E') {
      return
    }
    if (char === String(Number.parseInt(char))) {
      setInputValue((v) => Math.min(999, Number.parseInt(`${v}${char}`)))
    }
  }, [])

  return (
    <Box padding fillSpace>
      {/* above the fold container */}
      <Box grow minHeight={`100vh`}>
        <SiteHeader />
        {/* body */}
        <Grid columns={2} border grow>
          {/* left column */}
          <Box centerContent>
            <Grid columns={1} gap="md">
              <Text header="regular" align="center">
                Round 1
              </Text>
              <NumBox value={inputValue} cols={1} />
              <Grid
                columns={2}
                gap="sm"
                alignContent="center"
                alignItems="center"
              >
                <Box padding="sm" border centerContent gap="xs" grow>
                  <Text header="small">Current Jackpot</Text>
                  <Text header="regular" color="primary">
                    2.5eth
                  </Text>
                </Box>
                <Box padding="sm" gap="xs" border centerContent grow>
                  <Text header="small"># entries </Text>
                  <Text header="regular" color="primary">
                    24
                  </Text>
                </Box>

                <Box padding="sm" border centerContent gap="xs" cols={2}>
                  <Text header="small">The LUPI Reveal</Text>
                  <Text header="regular" color="primary">
                    {new Date().toLocaleDateString()}
                  </Text>
                </Box>
              </Grid>
            </Grid>
          </Box>
          {/* right column */}
          <Box grow centerContent>
            <NumPad onKeyPadPress={onKeyPadPress} />
          </Box>
        </Grid>
      </Box>
      <Box>
        <DebugPanel />
      </Box>
    </Box>
  )
}

export default App
