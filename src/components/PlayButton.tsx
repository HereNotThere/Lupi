import { Box, Text } from "src/ui";

export const PlayButton = () => (
  <Box
    minWidth={160}
    borderRadius="100"
    background="gradient"
    aspectRatio="square"
    centerContent
  >
    <Text header="xlarge" color="background">
      Play
    </Text>
  </Box>
);
