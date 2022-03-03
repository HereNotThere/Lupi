import { Box, Text } from '../ui'

export const SiteHeader = () => (
  <Box row padding="md" border borderRadius>
    <Box>
      <Text color="primary" header="regular">
        LUPI
      </Text>
    </Box>
    <Box row grow justifyContent="end" alignItems="center" gap="lg">
      <Text color="text" header="small">
        HOW TO PLAY
      </Text>
      <Text color="text" header="small">
        PAST LUPIS
      </Text>
      <Text color="text" header="small">
        CONNECT WALLET
      </Text>
    </Box>
  </Box>
)
