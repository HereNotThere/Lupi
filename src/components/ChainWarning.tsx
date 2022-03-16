import { AnimatePresence, motion } from "framer-motion";
import { useWeb3Context } from "src/hooks/useWeb3";
import { Box, Grid, Text } from "src/ui";
import { BigGreyButton } from "./Buttons";

export const ChainWarning = (props: { isChainSupported?: boolean }) => {
  const { isChainSupported } = props;
  const { addArbitrumOneChain, requestAccounts } = useWeb3Context();

  return (
    <AnimatePresence>
      <MotionBox
        gap="lg"
        centerContent
        transition={{ delay: 1 }}
        variants={{
          hidden: {
            opacity: 0,
          },
          show: {
            opacity: 1,
          },
        }}
        initial="hidden"
        animate="show"
      >
        {!isChainSupported ? (
          <>
            <Box centerContent>
              <Text
                color={isChainSupported ? "text" : "secondary"}
                header="large"
              >
                Unsupported chain
              </Text>
              <Text color="muted">
                Please switch to one of the supported networks
              </Text>
            </Box>
            <Box centerContent>
              <Grid columns={2} gap="lg">
                <BigGreyButton
                  onClick={addArbitrumOneChain}
                  transition={{ delay: 1.1 }}
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    show: { opacity: 1, scale: 1 },
                  }}
                  initial="hidden"
                  animate="show"
                >
                  Arbitrum
                </BigGreyButton>
              </Grid>
            </Box>
          </>
        ) : (
          <>
            <MotionBox
              centerContent
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Text
                color={isChainSupported ? "text" : "secondary"}
                header="large"
              >
                Disconnected
              </Text>
              <Text color="muted">Connect your wallet to play LUPI</Text>
            </MotionBox>
            <MotionBox
              centerContent
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
            >
              <BigGreyButton onClick={requestAccounts}>
                Connect Wallet
              </BigGreyButton>
            </MotionBox>
          </>
        )}
      </MotionBox>
    </AnimatePresence>
  );
};

const MotionBox = motion(Box);
